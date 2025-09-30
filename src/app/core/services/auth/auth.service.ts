import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../config/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  obtenerUUID(): string | null {
    //return "b52b2b8d-0328-11ef-b86a-6a3d6524d860";
    return localStorage.getItem('uuid');
  }

  guardarUUID(uuid: string): void {
    localStorage.setItem('uuid', uuid);
  }

  logout(): void {
    localStorage.removeItem('uuid');
    window.location.href = 'https://dradscare.com';
  }

  validarSesion(): Observable<boolean> {
    const uuid = this.obtenerUUID();
    if (!uuid) {
      this.logout();
      return of(false);
    }

    return this.http.get<any>(`${API_ENDPOINTS.validarUuid}?uuid=${uuid}`).pipe(
      tap(res => {
        if (!res.status) {
          this.logout();
        }
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }
}
