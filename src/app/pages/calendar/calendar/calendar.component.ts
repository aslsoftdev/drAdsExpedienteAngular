import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniCalendarComponent } from '../mini-calendar/mini-calendar.component';
import { WeekCalendarComponent } from '../week-calendar/week-calendar.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AppointmentService } from '../../../core/services/appointment/appointment.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogAvisoComponent } from '../../../shared/dialog-aviso/dialog-aviso.component';
import { DialogConfirmarComponent } from '../../../shared/dialog-confirmar/dialog-confirmar.component';
import { DialogLoaderComponent } from '../../../shared/dialog-loader/dialog-loader.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MiniCalendarComponent,
    WeekCalendarComponent,
    MatDialogModule,
    MatButtonModule,
    DialogAvisoComponent,
    DialogConfirmarComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})

export class CalendarComponent implements OnInit {
  selectedDate: Date = new Date();
  currentYear = new Date().getFullYear();
  menuOpen = false;
  appointments: any[] = [];
  cargando = true;

  @ViewChild(WeekCalendarComponent) calendario!: WeekCalendarComponent;

  constructor(
    private auth: AuthService,
    private appointmentService: AppointmentService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.auth.validarSesion().subscribe(valido => {
      if (valido) {
        this.cargarProximasCitas();
        this.calendario.cargarEventosWeek();
      }
    });
  }

  cargarProximasCitas() {
    this.cargando = true;

    this.appointmentService.getProximasCitas().subscribe(res => {
      this.cargando = false;
      if (res.status) {
        this.appointments = res.appointments;
      }
    });
  }

  cargarProximasCitasCalendar(){
    this.cargarProximasCitas();
  }

  getBadge(status: string): string {
    switch (status) {
      case 'Registrada':
        return 'badge bg-info';
      case 'Confirmada':
      case 'Atendida':
        return 'badge bg-success';
      case 'Reagendada':
        return 'badge bg-warning';
      case 'No asistió':
      case 'Cancelada':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  private actualizarEstadoCita(id: number, status: string, tituloExito: string, tituloError: string) {
    const uuid = this.auth.obtenerUUID();
    if (!uuid) return;

    // abrir loader
    const loaderRef = this.dialog.open(DialogLoaderComponent, {
      disableClose: true,
      width: '200px',
      panelClass: 'no-padding-dialog'
    });

    this.appointmentService.cambiarEstadoCita(id, status).subscribe({
      next: (res) => {
        loaderRef.close(); // cerrar loader
        this.dialog.open(DialogAvisoComponent, {
          width: '420px',
          data: {
            titulo: res.status ? tituloExito : tituloError,
            mensaje: res.message || (res.status ? 'Acción realizada correctamente.' : 'No se pudo completar la acción.'),
            tipo: res.status ? 'success' : 'error'
          }
        });

        if (res.status) {
          this.cargarProximasCitas();
          this.calendario.cargarEventosWeek();
        }
      },
      error: () => {
        loaderRef.close(); // cerrar loader
        this.dialog.open(DialogAvisoComponent, {
          width: '420px',
          data: {
            titulo: tituloError,
            mensaje: 'Error de conexión con el servidor',
            tipo: 'error'
          }
        });
      }
    });
  }

  confirmarCita(id: number) {
    const dialogRef = this.dialog.open(DialogConfirmarComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar cita',
        mensaje: 'Se CONFIRMARÁ la cita, ¿desea continuar?',
        confirmText: 'Sí, confirmar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.actualizarEstadoCita(id, 'Confirmada', 'Cita confirmada', 'Error al confirmar');
      }
    });
  }

  marcarAtendida(id: number) {
    const dialogRef = this.dialog.open(DialogConfirmarComponent, {
      width: '420px',
      data: {
        titulo: 'Cita atendida',
        mensaje: 'Se marcará la cita como ATENDIDA, ¿desea continuar?',
        confirmText: 'Sí, continuar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.actualizarEstadoCita(id, 'Atendida', 'Cita atendida', 'Error al marcar atendida');
      }
    });
  }

  marcarNoAsistio(id: number) {
    const dialogRef = this.dialog.open(DialogConfirmarComponent, {
      width: '420px',
      data: {
        titulo: 'Cita no atendida',
        mensaje: 'Se marcará la cita como NO ASISTIDA, ¿desea continuar?',
        confirmText: 'Sí, continuar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.actualizarEstadoCita(id, 'No asistió', 'Cita marcada como no asistida', 'Error al marcar no asistida');
      }
    });
  }

  cancelarCita(id: number) {
    const dialogRef = this.dialog.open(DialogConfirmarComponent, {
      width: '420px',
      data: {
        titulo: 'Cancelar cita',
        mensaje: 'Se CANCELARÁ la cita, ¿desea continuar?',
        confirmText: 'Sí, cancelar',
        cancelText: 'Cerrar'
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.actualizarEstadoCita(id, 'Cancelada', 'Cita cancelada', 'Error al cancelar');
      }
    });
  }


  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }

  logout() {
    localStorage.clear(); // borrar uuid, roles, etc.
    window.location.href = '/admin/logout'; // fuerza el PHP logout
  }
}
