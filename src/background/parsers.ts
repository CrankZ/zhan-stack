import type { PackageData, PackageManagerType } from '@/types';

/**
 * 简单的 XML 标签提取器。
 * 适用于 pom.xml, packages.config 等简单场景。
 */
function extractXmlTags(content: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'g');
  const matches = Array.from(content.matchAll(regex));
  return matches.map((match) => match[1].trim());
}

// ---------------- 解析包文件的主要入口 ----------------

/**
 * 解析包文件的主要入口。
 * 根据包管理器类型和文件路径分发到具体的解析器。
 *
 * @param response 获取到的响应对象
 * @param filePath 正在解析的文件路径
 * @param packageManager 包管理器类型
 * @returns 返回解析后的 PackageData 承诺
 */
export async function parsePackageFile(
  response: Response,
  filePath: string,
  packageManager: PackageManagerType,
): Promise<PackageData> {
  const content = await response.text();

  switch (packageManager) {
    case 'npm':
      if (filePath.endsWith('package.json')) {
        try {
          const pkg = JSON.parse(content) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
          return {
            dependencies: Object.assign({}, pkg.dependencies || {}),
            devDependencies: Object.assign({}, pkg.devDependencies || {}),
          };
        } catch (_error) {}
      }
      return { dependencies: {}, devDependencies: {} };
    case 'pip':
      return parseRequirementsTxt(content);
    case 'poetry':
    case 'uv':
      return parsePyprojectToml(content);
    case 'pipenv':
      return parsePipfile(content);
    case 'conda':
      return parseCondaEnvironment(content);
    case 'cargo':
      return parseCargoToml(content);
    case 'maven':
      return parseMavenPom(content);
    case 'gradle':
      return parseGradleBuild(content);
    case 'nuget':
      if (filePath.endsWith('packages.config')) return parseNuGetConfig(content);
      if (filePath.endsWith('.csproj')) return parseCsproj(content);
      if (filePath.endsWith('Directory.Packages.props'))
        return parseDirectoryPackagesProps(content);
      if (filePath.endsWith('.vcxproj')) return parseVcxproj(content);
      if (filePath.endsWith('.sln')) return parseSln(content);
      return { dependencies: {}, devDependencies: {} };
    case 'swiftpm':
      return parseSwiftPackage(content);
    case 'cocoapods':
      return parsePodfile(content);
    case 'carthage':
      return parseCartfile(content);
    case 'cmake':
      return parseCMakeLists(content);
    case 'bazel':
      if (filePath.endsWith('MODULE.bazel')) return parseBazelModule(content);
      if (filePath.endsWith('WORKSPACE') || filePath.endsWith('WORKSPACE.bazel'))
        return parseBazelWorkspace(content);
      return { dependencies: {}, devDependencies: {} };
    case 'xmake':
      return parseXmakeLua(content);
    case 'gomod':
      return parseGoMod(content);
    default:
      return { dependencies: {}, devDependencies: {} };
  }
}

// ---------------- Python 解析 ----------------

/**
 * 解析 Python requirements.txt 文件。
 * 处理换行符和版本说明符。
 *
 * @param content requirements.txt 的原始内容
 * @returns 包含依赖项的 PackageData
 */
export function parseRequirementsTxt(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const rawLines = content.replace(/\r/g, '').split('\n');
  const logical: string[] = [];
  let buf = '';
  for (const raw of rawLines) {
    const trimmed = raw.replace(/\s+$/g, '');
    if (!buf) buf = trimmed;
    else buf += ` ${trimmed}`;
    if (trimmed.endsWith('\\')) {
      buf = buf.slice(0, -1).trimEnd();
      continue;
    }
    logical.push(buf);
    buf = '';
  }
  if (buf) logical.push(buf);

  const skipPrefixes = [
    '-r ',
    '--requirement ',
    '--constraint ',
    '--index-url ',
    '--extra-index-url ',
    '--find-links ',
    '--trusted-host ',
    '--only-binary ',
    '--no-binary ',
    '--pre ',
    '--config-settings ',
  ];

  for (const line of logical) {
    let t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (skipPrefixes.some((p) => t.startsWith(p))) continue;
    t = t.replace(/\s*--hash=\S+/g, '').trim();
    const atMatch = t.match(/^([A-Za-z0-9_.-]+)\s*@\s*(\S+)/);
    if (atMatch) {
      const name = atMatch[1].replace(/\[[^\]]*]/, '');
      const versionSpec = `@${atMatch[2]}`;
      dependencies[name] = versionSpec || 'unknown';
      continue;
    }
    const semiIdx = t.indexOf(';');
    const base = semiIdx !== -1 ? t.slice(0, semiIdx).trim() : t;
    const ops = ['===', '==', '!=', '~=', '>=', '<=', '>', '<'];
    let opIdx = -1;
    let op = '';
    for (const o of ops) {
      const i = base.indexOf(o);
      if (i !== -1 && (opIdx === -1 || i < opIdx)) {
        opIdx = i;
        op = o;
      }
    }
    if (opIdx !== -1) {
      const name = base
        .slice(0, opIdx)
        .trim()
        .replace(/\[[^\]]*]/, '');
      const rhs = base.slice(opIdx + op.length).trim();
      const versionSpec = `${op}${rhs}` || 'unknown';
      if (name) dependencies[name] = versionSpec;
    } else {
      const name = base.trim().replace(/\[[^\]]*]/, '');
      if (!name.startsWith('-') && name) {
        dependencies[name] = 'unknown';
      }
    }
  }
  return { dependencies, devDependencies: {} };
}

export function parsePyprojectToml(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const lines = content.split('\n');
  let section: 'none' | 'project' | 'optional' | 'poetryDeps' | 'poetryDev' = 'none';
  let collectingArray = false;
  let arrayBuffer = '';

  const setDep = (name: string, version: string, isDev: boolean) => {
    if (!name) return;
    if (isDev) {
      if (!(name in devDependencies)) devDependencies[name] = version || 'unknown';
    } else {
      if (!(name in dependencies)) dependencies[name] = version || 'unknown';
    }
  };

  const parseSpec = (spec: string): { name: string; version: string } => {
    let s = spec.trim();
    if (!s) return { name: '', version: '' };
    if (s.startsWith('"') || s.startsWith("'")) s = s.slice(1);
    if (s.endsWith(',')) s = s.slice(0, -1);
    if (s.endsWith('"') || s.endsWith("'")) s = s.slice(0, -1);
    s = s.replace(/\s*#.*$/, '').trim();
    const urlMatch = s.match(/^([A-Za-z0-9_.-]+)\s*@\s*(.+)$/);
    if (urlMatch) return { name: urlMatch[1].trim(), version: `@${urlMatch[2].trim()}` };
    const noMarker = s.split(';')[0].trim();
    const noExtras = noMarker.replace(/\[[^\]]+]/, '').trim();
    const ops = ['===', '==', '!=', '~=', '>=', '<=', '>', '<'];
    let idx = -1;
    for (const o of ops) {
      const i = noExtras.indexOf(o);
      if (i !== -1 && (idx === -1 || i < idx)) idx = i;
    }
    if (idx !== -1) {
      const name = noExtras.slice(0, idx).trim();
      const version = noExtras.slice(idx).trim();
      return { name, version: version || 'unknown' };
    }
    const parts = noExtras.split(/\s+/);
    const name = parts[0]?.trim() || '';
    const version = parts.slice(1).join(' ').trim() || 'unknown';
    return { name, version };
  };

  const flushArrayBuffer = (isDev: boolean) => {
    const m: RegExp = /(["'])(.*?)\1/g;
    for (;;) {
      const r = m.exec(arrayBuffer);
      if (!r) break;
      const { name, version } = parseSpec(r[2]);
      setDep(name, version, isDev);
    }
    arrayBuffer = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;

    if (t.startsWith('[') && t.endsWith(']')) {
      collectingArray = false;
      arrayBuffer = '';
      if (t === '[project]') section = 'project';
      else if (t === '[project.optional-dependencies]') section = 'optional';
      else if (t === '[tool.poetry.dependencies]') section = 'poetryDeps';
      else if (
        t === '[tool.poetry.dev-dependencies]' ||
        t === '[tool.poetry.group.dev.dependencies]'
      )
        section = 'poetryDev';
      else section = 'none';
      continue;
    }

    if (section === 'project') {
      const depsStart = t.match(/^dependencies\s*=\s*\[/);
      if (depsStart) {
        collectingArray = true;
        const inlineBracket = t.match(/dependencies\s*=\s*\[([\s\S]*?)]/);
        if (inlineBracket) {
          arrayBuffer = inlineBracket[1];
          flushArrayBuffer(false);
          collectingArray = false;
        } else {
          const after = line.split('[')[1] || '';
          arrayBuffer += `${after}\n`;
        }
        continue;
      }
      if (collectingArray) {
        if (t.includes(']')) {
          arrayBuffer += line.split(']')[0];
          flushArrayBuffer(false);
          collectingArray = false;
        } else {
          arrayBuffer += `${line}\n`;
        }
        continue;
      }
    }

    if (section === 'optional') {
      const grpStart = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*\[/);
      if (grpStart) {
        collectingArray = true;
        const inline = t.match(/^[A-Za-z0-9_.-]+\s*=\s*\[([\s\S]*?)]/);
        if (inline) {
          arrayBuffer = inline[1];
          flushArrayBuffer(true);
          collectingArray = false;
        } else {
          const after = line.split('[')[1] || '';
          arrayBuffer += `${after}\n`;
        }
        continue;
      }
      if (collectingArray) {
        if (t.includes(']')) {
          arrayBuffer += line.split(']')[0];
          flushArrayBuffer(true);
          collectingArray = false;
        } else {
          arrayBuffer += `${line}\n`;
        }
        continue;
      }
    }

    if (section === 'poetryDeps' || section === 'poetryDev') {
      const isDev = section === 'poetryDev';
      const simple = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']/);
      if (simple) {
        const name = simple[1].trim();
        if (name.toLowerCase() !== 'python') {
          const version = simple[2].trim();
          setDep(name, version, isDev);
        }
      }
      const inlineStart = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{\s*$/);
      if (inlineStart) {
        const name = inlineStart[1].trim();
        if (name.toLowerCase() !== 'python') {
          let buf = '';
          let j = i + 1;
          while (j < lines.length) {
            const l = lines[j];
            buf += `${l.trim()}\n`;
            if (l.includes('}')) break;
            j++;
          }
          i = j;
          const ver = buf.match(/version\s*=\s*['"]([^'"]+)['"]/);
          const git = buf.match(/git\s*=\s*['"]([^'"]+)['"]/);
          const path = buf.match(/path\s*=\s*['"]([^'"]+)['"]/);
          const url = buf.match(/url\s*=\s*['"]([^'"]+)['"]/);
          const version =
            ver?.[1]?.trim() ||
            (git ? `@${git[1].trim()}` : path ? 'path' : url ? `@${url[1].trim()}` : 'unknown');
          setDep(name, version, isDev);
        }
      }
      const inlineOne = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{([\s\S]*?)}$/);
      if (inlineOne) {
        const name = inlineOne[1].trim();
        if (name.toLowerCase() !== 'python') {
          const inner = inlineOne[2];
          const ver = inner.match(/version\s*=\s*['"]([^'"]+)['"]/);
          const git = inner.match(/git\s*=\s*['"]([^'"]+)['"]/);
          const path = inner.match(/path\s*=\s*['"]([^'"]+)['"]/);
          const url = inner.match(/url\s*=\s*['"]([^'"]+)['"]/);
          const version =
            ver?.[1]?.trim() ||
            (git ? `@${git[1].trim()}` : path ? 'path' : url ? `@${url[1].trim()}` : 'unknown');
          setDep(name, version, isDev);
        }
      }
    }
  }

  return { dependencies, devDependencies };
}

export function parsePipfile(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { pipenv: 'unknown' };
  const lines = content.split('\n');
  let section: 'none' | 'packages' | 'dev' = 'none';
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    if (t.startsWith('[') && t.endsWith(']')) {
      if (t.toLowerCase() === '[packages]') section = 'packages';
      else if (t.toLowerCase() === '[dev-packages]') section = 'dev';
      else section = 'none';
      continue;
    }
    const m = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (m) {
      const name = m[1].trim();
      let spec = m[2].trim();
      spec = spec.replace(/[;,\s]+$/, '');
      if (spec.startsWith('"') || spec.startsWith("'")) {
        spec = spec.replace(/^['"]|['"]$/g, '');
      } else if (spec.startsWith('{')) {
        const ver = spec.match(/version\s*[:=]\s*['"]([^'"]+)['"]/);
        const git = spec.match(/git\s*[:=]\s*['"]([^'"]+)['"]/);
        const ref = spec.match(/ref\s*[:=]\s*['"]([^'"]+)['"]/);
        const path = spec.match(/path\s*[:=]\s*['"]([^'"]+)['"]/);
        spec =
          ver?.[1]?.trim() ||
          (ref ? `@${ref[1].trim()}` : git ? '@git' : path ? 'path' : 'unknown');
      } else {
        spec = spec || 'unknown';
      }
      if (section === 'dev') devDependencies[name] = spec;
      else dependencies[name] = spec;
    }
  }
  return { dependencies, devDependencies };
}

export function parseCondaEnvironment(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { conda: 'unknown' };
  const lines = content.split('\n');
  let inDeps = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.replace(/\r$/, '');
    const trimmed = t.trim();
    if (trimmed.startsWith('dependencies:')) {
      inDeps = true;
      continue;
    }
    if (inDeps) {
      if (trimmed.startsWith('- ')) {
        const item = trimmed.substring(2).trim();
        if (!item) continue;
        if (item.toLowerCase() === 'pip:' || item.toLowerCase() === 'pip') {
          inDeps = false;
          continue;
        }
        const parts = item.split('=');
        const name = parts[0].trim();
        dependencies[name] = parts.slice(1).join('=') || 'unknown';
      } else if (!trimmed || /^[A-Za-z]/.test(trimmed)) {
        inDeps = false;
      }
    }
  }
  return { dependencies, devDependencies };
}

// ---------------- Rust 解析 ----------------

export function parseCargoToml(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  const collectBlocks = (headerPattern: RegExp): string[] => {
    const blocks: string[] = [];
    const pattern = new RegExp(
      headerPattern.source,
      headerPattern.flags.includes('g') ? headerPattern.flags : `${headerPattern.flags}g`,
    );
    for (;;) {
      const match = pattern.exec(content);
      if (!match) break;
      const start = match.index + match[0].length;
      const rest = content.slice(start);
      const nhRel = rest.search(/\r?\n\[/);
      const end = nhRel === -1 ? content.length : start + nhRel;
      blocks.push(content.slice(start, end));
    }
    return blocks;
  };

  const depBlocks = collectBlocks(/\[dependencies]/);
  const devDepBlocks = collectBlocks(/\[dev-dependencies]/);
  const buildDepBlocks = collectBlocks(/\[build-dependencies]/);
  const targetDepBlocks = collectBlocks(/\[target[^\]]*\.dependencies]/);

  const parseBlock = (block: string): Record<string, string> => {
    const map: Record<string, string> = {};
    if (!block) return map;

    const simpleRegex = /^([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']/gm;
    for (;;) {
      const sm = simpleRegex.exec(block);
      if (!sm) break;
      const name = sm[1].trim();
      map[name] = sm[2].trim();
    }

    const inlineRegex = /^([A-Za-z0-9_.-]+)\s*=\s*\{([\s\S]*?)}/gm;
    for (;;) {
      const im = inlineRegex.exec(block);
      if (!im) break;
      const name = im[1].trim();
      const inner = im[2];
      const verMatch = inner.match(/version\s*=\s*["']([^"']+)["']/i);
      map[name] = verMatch ? verMatch[1].trim() : 'unknown';
    }
    return map;
  };

  for (const b of depBlocks) Object.assign(dependencies, parseBlock(b));
  for (const b of targetDepBlocks) Object.assign(dependencies, parseBlock(b));
  for (const b of devDepBlocks) Object.assign(devDependencies, parseBlock(b));
  for (const b of buildDepBlocks) Object.assign(devDependencies, parseBlock(b));
  return { dependencies, devDependencies };
}

// ---------------- Java & C# 解析 ----------------

export function parseMavenPom(content: string): PackageData {
  const dependencies: Record<string, string> = {};

  // 提取 <dependencies> 块
  const depsBlocks = content.match(/<dependencies>([\s\S]*?)<\/dependencies>/g);
  if (!depsBlocks) return { dependencies: {}, devDependencies: {} };

  for (const block of depsBlocks) {
    const depTags = extractXmlTags(block, 'dependency');
    for (const tag of depTags) {
      const groupId = tag.match(/<groupId>(.*?)<\/groupId>/)?.[1] || '';
      const artifactId = tag.match(/<artifactId>(.*?)<\/artifactId>/)?.[1] || '';
      const version = tag.match(/<version>(.*?)<\/version>/)?.[1] || 'unknown';

      if (artifactId) {
        const fullName = groupId ? `${groupId}:${artifactId}` : artifactId;
        dependencies[fullName] = version;
      }
    }
  }

  return { dependencies, devDependencies: {} };
}

export function parseGradleBuild(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const lines = content.split('\n');
  let inDependencies = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === 'dependencies {') {
      inDependencies = true;
      continue;
    }
    if (inDependencies && t === '}') {
      inDependencies = false;
      continue;
    }
    if (inDependencies) {
      const m = t.match(/(?:implementation|api|compile|runtime)(?:\s+)?['"](.+?):(.+?):(.+?)['"]/);
      if (m) dependencies[`${m[1]}:${m[2]}`] = m[3];
    }
  }
  return { dependencies, devDependencies: {} };
}

export function parseNuGetConfig(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.includes('<package ')) {
      const id = t.match(/id="(.*?)"/)?.[1];
      const version = t.match(/version="(.*?)"/)?.[1];
      if (id && version) dependencies[id] = version;
    }
  }
  return { dependencies, devDependencies: {} };
}

export function parseCsproj(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const selfClosingRegex = /<PackageReference[^>]*Include="([^"]+)"[^>]*Version="([^"]+)"[^>]*\/>/g;
  for (;;) {
    const m = selfClosingRegex.exec(content);
    if (!m) break;
    dependencies[m[1]] = m[2];
  }
  const blockRegex = /<PackageReference[^>]*Include="([^"]+)"[^>]*>([\s\S]*?)<\/PackageReference>/g;
  for (;;) {
    const bm = blockRegex.exec(content);
    if (!bm) break;
    const name = bm[1];
    const inner = bm[2];
    const verMatch = inner.match(/<Version>([^<]+)<\/Version>/);
    dependencies[name] = verMatch ? verMatch[1].trim() : 'unknown';
  }
  const updateRegex = /<PackageReference[^>]*Update="([^"]+)"[^>]*Version="([^"]+)"[^>]*\/>/g;
  for (;;) {
    const um = updateRegex.exec(content);
    if (!um) break;
    if (!dependencies[um[1]]) dependencies[um[1]] = um[2];
  }
  return { dependencies, devDependencies: {} };
}

export function parseDirectoryPackagesProps(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const selfClosingRegex = /<PackageVersion[^>]*Include="([^"]+)"[^>]*Version="([^"]+)"[^>]*\/>/g;
  for (;;) {
    const m = selfClosingRegex.exec(content);
    if (!m) break;
    dependencies[m[1]] = m[2];
  }
  const blockRegex = /<PackageVersion[^>]*Include="([^"]+)"[^>]*>([\s\S]*?)<\/PackageVersion>/g;
  for (;;) {
    const bm = blockRegex.exec(content);
    if (!bm) break;
    const name = bm[1];
    const inner = bm[2];
    const verMatch = inner.match(/<Version>([^<]+)<\/Version>/);
    dependencies[name] = verMatch ? verMatch[1].trim() : 'unknown';
  }
  return { dependencies, devDependencies: {} };
}

// ---------------- Swift / CocoaPods / Carthage / Xcode 解析 ----------------

export function parseSwiftPackage(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const lines = content.split('\n');
  let inDependencies = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.includes('dependencies: [')) {
      inDependencies = true;
      continue;
    }
    if (inDependencies && (t === '],' || t === ']')) {
      inDependencies = false;
      continue;
    }
    if (inDependencies) {
      const fromMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*from:\s*"(.*?)"\)/);
      const exactMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*exact:\s*"(.*?)"\)/);
      const branchMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*branch:\s*"(.*?)"\)/);
      const revMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*revision:\s*"(.*?)"\)/);
      const nextMajorMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*upToNextMajor:\s*"(.*?)"\)/);
      const nextMinorMatch = t.match(/\.package\(url:\s*"(.*?)"[\s,]*upToNextMinor:\s*"(.*?)"\)/);
      const m =
        fromMatch || exactMatch || branchMatch || revMatch || nextMajorMatch || nextMinorMatch;
      if (m) {
        const url = m[1];
        const version = m[2] || 'unknown';
        const repoName = url.split('/').pop()?.replace('.git', '') || url;
        dependencies[repoName] = version;
      }
    }
  }
  return { dependencies, devDependencies: {} };
}

export function parsePodfile(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { cocoapods: 'unknown' };
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (/^pod\s+['"][^'"]+['"]/i.test(t)) {
      const nameMatch = t.match(/pod\s+['"]([^'"]+)['"]/i);
      const name = nameMatch ? nameMatch[1].trim() : '';
      if (!name) continue;
      const verArg = t.match(/pod\s+['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]/i);
      let version = verArg ? verArg[1].trim() : 'unknown';
      const branch = t.match(/:branch\s*=>\s*['"]([^'"]+)['"]/);
      const commit = t.match(/:commit\s*=>\s*['"]([^'"]+)['"]/);
      const git = t.match(/:git\s*=>\s*['"]([^'"]+)['"]/);
      const path = t.match(/:path\s*=>\s*['"]([^'"]+)['"]/);
      if (branch) version = `@${branch[1].trim()}`;
      else if (commit) version = `@${commit[1].trim()}`;
      else if (git && version === 'unknown') version = '@git';
      else if (path) version = 'path';
      dependencies[name] = version;
    }
  }
  return { dependencies, devDependencies };
}

export function parseCartfile(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { carthage: 'unknown' };
  const lines = content.split('\n');
  for (const raw of lines) {
    const line = raw.split('//')[0].trim();
    if (!line) continue;
    const m = line.match(/^github\s+['"]([^'"]+)['"]\s*(.*)$/i);
    if (m) {
      const full = m[1];
      const tail = m[2].trim();
      const repo = full.split('/').pop() || full;
      const verMatch = tail.match(/(~>\s*\S+|==\s*\S+|"[^"]+"|\d\S*)/);
      dependencies[repo] = verMatch ? verMatch[0].replace(/^"|"$/g, '').trim() : 'unknown';
      continue;
    }
    const b = line.match(/^binary\s+['"][^'"]+['"]\s*(.*)$/i);
    if (b) {
      dependencies['carthage-binary'] = b[1].trim() || 'unknown';
    }
  }
  return { dependencies, devDependencies };
}

export function parseCMakeLists(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('find_package(')) {
      const m = t.match(/find_package\((\w+)/);
      if (m) dependencies[m[1]] = 'unknown';
    }
  }
  return { dependencies, devDependencies: {} };
}

export function parseXmakeLua(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = { xmake: 'unknown' };

  const collectFromArgs = (args: string) => {
    const strRegex = /["']([^"'\\]+)["']/g;
    for (;;) {
      const sm = strRegex.exec(args);
      if (!sm) break;
      const raw = sm[1].trim();
      const name = raw.split(/\s|>=|==|<=|~=|\^|~|\*|\./)[0].trim();
      const verMatch = raw.match(/(>=|==|<=|~=|\^|~)\s*([0-9A-Za-z_.-]+)/);
      const version = (verMatch?.[2] || 'unknown').trim();
      if (name && !(name in dependencies)) dependencies[name] = version;
    }
  };

  const reqRegex = /add_requires\(([\s\S]*?)\)/g;
  for (;;) {
    const rm = reqRegex.exec(content);
    if (!rm) break;
    collectFromArgs(rm[1]);
  }
  const pkgRegex = /add_packages\(([\s\S]*?)\)/g;
  for (;;) {
    const pm = pkgRegex.exec(content);
    if (!pm) break;
    collectFromArgs(pm[1]);
  }
  const linksRegex = /add_links\(([\s\S]*?)\)/g;
  for (;;) {
    const lm = linksRegex.exec(content);
    if (!lm) break;
    collectFromArgs(lm[1]);
  }
  return { dependencies, devDependencies };
}

export function parseVcxproj(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const mfcMatch = content.match(/<UseOfMfc>\s*([^<\s]+)\s*<\/UseOfMfc>/i);
  if (mfcMatch) dependencies.mfc = mfcMatch[1].toLowerCase();
  const toolsetMatch = content.match(/<PlatformToolset>\s*([^<\s]+)\s*<\/PlatformToolset>/i);
  if (toolsetMatch) dependencies.msvc = toolsetMatch[1];
  const winSdkMatch = content.match(
    /<WindowsTargetPlatformVersion>\s*([^<\s]+)\s*<\/WindowsTargetPlatformVersion>/i,
  );
  if (winSdkMatch) dependencies['windows-sdk'] = winSdkMatch[1];
  const addDepsRegex = /<AdditionalDependencies>\s*([^<]+)\s*<\/AdditionalDependencies>/gi;
  const libSet = new Set<string>();
  for (;;) {
    const adm = addDepsRegex.exec(content);
    if (!adm) break;
    const list = adm[1]
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('$(AdditionalDependencies)'));
    for (const lib of list) libSet.add(lib);
  }
  libSet.forEach((lib) => {
    const name = lib.toLowerCase().endsWith('.lib') ? lib : `${lib}`;
    dependencies[name] = 'unknown';
  });
  dependencies.msbuild = 'unknown';
  return { dependencies, devDependencies };
}

export function parseSln(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const projRegex = /Project\([^)]*\)\s*=\s*"([^"]+)"\s*,\s*"([^"]+)"/g;
  for (;;) {
    const m = projRegex.exec(content);
    if (!m) break;
    const projName = m[1].trim();
    dependencies[projName] = 'unknown';
  }
  dependencies.msbuild = 'unknown';
  dependencies['visual-studio-sln'] = 'unknown';
  return { dependencies, devDependencies };
}

// ---------------- Go 解析 ----------------

export function parseGoMod(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  const lines = content.split('\n');
  let inRequireBlock = false;
  for (const rawLine of lines) {
    const line = rawLine.split('//')[0].trim();
    if (!line) continue;
    if (line.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line.startsWith(')')) {
      inRequireBlock = false;
      continue;
    }
    if (line.startsWith('require ') || inRequireBlock) {
      const entry = inRequireBlock ? line : line.replace(/^require\s+/, '');
      const parts = entry.trim().split(/\s+/);
      if (parts.length >= 2) {
        const modulePath = parts[0];
        const version = parts[1];
        if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) {
          dependencies[modulePath] = version || 'unknown';
        }
      }
    }
  }
  return { dependencies, devDependencies: {} };
}

// ---------------- Bazel 解析 ----------------

export function parseBazelModule(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  dependencies.bazel = 'unknown';
  const namedRegex = /bazel_dep\s*\(\s*([\s\S]*?)\)/g;
  for (;;) {
    const nm = namedRegex.exec(content);
    if (!nm) break;
    const args = nm[1];
    const nameMatch = args.match(/name\s*=\s*['"]([^'"\\]+)['"]/);
    const versionMatch = args.match(/version\s*=\s*['"]([^'"\\]+)['"]/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      dependencies[name] = versionMatch ? versionMatch[1].trim() : 'unknown';
    }
  }
  const positionalRegex = /bazel_dep\s*\(\s*['"]([^'"\\]+)['"]\s*,\s*['"]([^'"\\]+)['"]\s*\)/g;
  for (;;) {
    const pm = positionalRegex.exec(content);
    if (!pm) break;
    const name = pm[1].trim();
    const version = pm[2].trim();
    dependencies[name] = version || 'unknown';
  }
  return { dependencies, devDependencies: {} };
}

export function parseBazelWorkspace(content: string): PackageData {
  const dependencies: Record<string, string> = {};
  dependencies.bazel = 'unknown';
  const httpArchiveRegex = /http_archive\s*\(\s*([\s\S]*?)\)/g;
  for (;;) {
    const ham = httpArchiveRegex.exec(content);
    if (!ham) break;
    const args = ham[1];
    const nameMatch = args.match(/name\s*=\s*['"]([^'"\\]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    const tagMatch = args.match(/tag\s*=\s*['"]v?([0-9]+(?:\.[0-9]+){1,3})['"]/);
    const spMatch = args.match(/strip_prefix\s*=\s*['"][^'"\n]*?([0-9]+(?:\.[0-9]+){1,3})['"]/);
    dependencies[name] = (tagMatch?.[1] || spMatch?.[1] || 'unknown').trim();
  }
  const gitRepoRegex = /git_repository\s*\(\s*([\s\S]*?)\)/g;
  for (;;) {
    const grm = gitRepoRegex.exec(content);
    if (!grm) break;
    const args = grm[1];
    const nameMatch = args.match(/name\s*=\s*['"]([^'"\\]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    const tagMatch = args.match(/tag\s*=\s*['"]v?([0-9]+(?:\.[0-9]+){1,3})['"]/);
    dependencies[name] = (tagMatch?.[1] || 'unknown').trim();
  }
  return { dependencies, devDependencies: {} };
}
