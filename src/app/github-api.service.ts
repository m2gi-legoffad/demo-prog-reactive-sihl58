import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  ConnectableObservable,
  Observable,
  of,
  Subject,
} from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import {
  map,
  multicast,
  refCount,
  scan,
  startWith,
  switchMap,
  switchMapTo,
  tap,
} from 'rxjs/operators';

/*
 * Voir https://docs.github.com/en/free-pro-team@latest/rest/reference/users
 */
@Injectable()
export class GithubApiService {
  private refreshSubj = new Subject<void>();
  private deletedSubj = new Subject<DataUser>();

  public Ldeleted: Observable<DataUser[]>;
  public usersObs: Observable<DataUser[]>;

  constructor() {
    // l'observable de 50 utilisateurs github
    const Lall = this.refreshSubj.pipe(
      switchMap(() => fromPromise(this.getUsers()))
    );

    this.Ldeleted = this.refreshSubj.pipe(
      switchMap(() =>
        this.deletedSubj.pipe(
          scan((L, u) => [...L, u], []),
          startWith([])
        )
      )
    );

    this.usersObs = combineLatest([Lall, this.Ldeleted]).pipe(
      map(([A, D]) =>
        A.filter((user) => {
          return D.indexOf(user) < 0;
        })
      )
    );

    this.refresh();
  }

  async getUsers(): Promise<DataUser[]> {
    const R = await fetch(
      `https://api.github.com/users?since=${1000 * Math.random()}`
    );
    if (R.status >= 200 && R.status < 300) {
      const L: DataUser[] = await R.json(); // any -> DataUser[]
      return L;
    } else {
      return [
        { login: 'Bob' },
        { login: 'Jo' },
        { login: 'Avrel' },
        { login: 'Tao' },
        { login: 'Kenzi' },
        { login: 'Jacques' },
      ].sort((a, b) => Math.round(2 * Math.random() - 1));
    }
  }

  refresh(): void {
    this.refreshSubj.next();
  }

  deleteUser(u: DataUser) {
    this.deletedSubj.next(u);
  }
}

export interface DataUser {
  login: string;
}
