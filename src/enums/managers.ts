import type { PackageManagerType } from '@/types';

export const JS_MANAGERS: PackageManagerType[] = ['npm'];
export const PYTHON_MANAGERS: PackageManagerType[] = ['pip', 'poetry', 'pipenv', 'uv', 'conda'];
export const RUST_MANAGERS: PackageManagerType[] = ['cargo'];
export const JAVA_MANAGERS: PackageManagerType[] = ['maven', 'gradle'];
export const DOTNET_MANAGERS: PackageManagerType[] = ['nuget'];
export const SWIFT_MANAGERS: PackageManagerType[] = ['swiftpm', 'cocoapods', 'carthage'];
export const GO_MANAGERS: PackageManagerType[] = ['gomod'];
