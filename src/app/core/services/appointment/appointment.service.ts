import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../config/constants';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private getUuid(): string {
    const uuid = this.auth.obtenerUUID();
    if (!uuid) {
      throw new Error('UUID no encontrado en sesión');
    }
    return uuid;
  }

  getProximasCitas(): Observable<any> {
    const uuid = this.getUuid();
    return this.http.get<any>(`${API_ENDPOINTS.getProximasCitas}?uuid=${uuid}`);
  }

  cambiarEstadoCita(appointmentId: number, status: string): Observable<any> {
    const uuid = this.getUuid();
    return this.http.post<any>(`${API_ENDPOINTS.cambiarEstadoCita}`, {
      uuid,
      appointment_id: appointmentId,
      status
    });
  }

  getEtiquetas(): Observable<any> {
    const uuid = this.getUuid();
    return this.http.get<any>(`${API_ENDPOINTS.getEtiquetas}?uuid=${uuid}`);
  }

  guardarBloqueo(
    id: number,
    name: string,
    date_start: string,
    date_end: string,
    time_start: string,
    time_end: string
  ): Observable<any> {
    const uuid = this.auth.obtenerUUID(); // usa AuthService
    return this.http.post<any>(`${API_ENDPOINTS.guardarBloqueo}`, {
      id,
      uuid,
      name,
      date_start,
      date_end,
      time_start,
      time_end
    });
  }

  eliminarBloqueo(id_day: number): Observable<any> {
    const uuid = localStorage.getItem('uuid');
    return this.http.post<any>(`${API_ENDPOINTS.eliminarBloqueo}`, {
      uuid,
      id_day
    });
  }

  buscarPacientes(search: string): Observable<any> {
    const uuid = this.getUuid();
    return this.http.post<any>(`${API_ENDPOINTS.buscarPaciente}`, {
      uuid,
      search
    });
  }

  guardarCita(citaData: any): Observable<any> {
    const uuid = this.getUuid();

    return this.http.post<any>(`${API_ENDPOINTS.guardarCita}`, {
      uuid,
      ...citaData
    });
  }

  getConsultorios(): Observable<any> {
    const uuid = this.getUuid();
    return this.http.get<any>(`${API_ENDPOINTS.getConsultorios}?uuid=${uuid}`);
  }
  
  getCalendario(): Observable<any> {
    const uuid = this.getUuid();
    return this.http.get<any>(
      `${API_ENDPOINTS.getCalendario}?uuid=${uuid}`
    );
  }

  getMediosContacto(): Observable<any> {
    const uuid = this.getUuid();
    return this.http.get<any>(
      `${API_ENDPOINTS.getMediosContacto}?uuid=${uuid}`
    );
  }
}
