export interface IRouter<T> {
  setImplementationForTesting(implementation: T): void;
}
