import { TimerRepository, RepositoryBackend } from './RepositoryTypes';
import { LocalStorageTimerRepository } from './localstorage/LocalStorageTimerRepository';
import { SqliteTimerRepository } from './sqlite/SqliteTimerRepository';
import { RemoteTimerRepository } from './remote/RemoteTimerRepository';

export class RepositoryFactory {
  static create(backend: RepositoryBackend): TimerRepository {
    switch (backend) {
      case 'localStorage':
        return new LocalStorageTimerRepository();
      case 'sqlite':
        return new SqliteTimerRepository();
      case 'remote':
        return new RemoteTimerRepository();
      default:
        throw new Error(`Unknown repository backend: "${backend}"`);
    }
  }
}
