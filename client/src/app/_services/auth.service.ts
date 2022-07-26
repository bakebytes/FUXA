import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User, UserGroups } from '../_models/user';
import { environment } from '../../environments/environment';
import { EndPointApi } from '../_helpers/endpointapi';

@Injectable()
export class AuthService {

	private currentUser: UserProfile;
	private endPointConfig: string = EndPointApi.getURL();

	constructor(private http: HttpClient) { 
		let user = JSON.parse(localStorage.getItem('currentUser'));
		if (user) {
		  this.currentUser = user;
		}
	}

	signIn(username: string, password: string) {
		return new Observable((observer) => {
			if (environment.serverEnabled) {
				let header = new HttpHeaders({ 'Content-Type': 'application/json' });
				return this.http.post(this.endPointConfig + '/api/signin', { username: username, password: password }).subscribe((result: any) => {
					if (result) {
						this.currentUser = <UserProfile>result.data;
						this.saveUserToken(this.currentUser)
					}
					observer.next();
				}, err => {
					console.error(err);
					observer.error(err);
				});
			} else {
				observer.next();
			}
		});

	}

	checkAutorization(asViewer: boolean): Observable<boolean> {
        return new Observable((observer) => {
			this.http.get<any>(this.endPointConfig + '/api/permission').subscribe(result => {
				this.currentUser = <UserProfile>result;
				if (!asViewer && !this.isAdmin()) {
					observer.next(false);
				} else {
					observer.next(true);
				}
			}, err => {
				console.error(err);
				observer.next(false);
			});
        });
    }

	signOut() {
		this.removeUser();
	}

	getUser(): User {
		return this.currentUser;
	}

	getUserToken(): string {
		return this.getCookieValue('token');
	}

    isAdmin(): boolean {
        if (this.currentUser && UserGroups.ADMINMASK.indexOf(this.currentUser.groups) !== -1) {
            return true;
        }
        return false;
    }

	private getCookieValue(name: string) {
		let tk = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
		if (tk) {
			return tk.split('=')[1];
		}
		return '';
	}

	// to check by page refresh
	private saveUserToken(user: UserProfile) {
		localStorage.setItem('currentUser', JSON.stringify(user));
		// document.cookie = `token=${user.token}`;
	}

	private removeUser() {
		this.currentUser = null;
		localStorage.removeItem('currentUser');
	}
}

export class UserProfile extends User {
	token: string;
}