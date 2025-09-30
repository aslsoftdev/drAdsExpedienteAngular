import {
  Component,
  Input,
  OnChanges
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment/appointment.service';
import { DialogAvisoComponent } from '../../../shared/dialog-aviso/dialog-aviso.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmarComponent } from '../../../shared/dialog-confirmar/dialog-confirmar.component';
import { ViewChild } from '@angular/core';
import { CalendarComponent } from '../calendar/calendar.component';
import { EventEmitter, Output } from '@angular/core';


interface EventData {
  id: number;
  id_block?: number; // para bloqueos que no traen id normal
  title: string;

  start: Date;
  end: Date;
  medio_contacto: number;

  formatted_date_time?: string;
  formatted_time?: string;
  duration_appointment?: number;
  date_appointment?: string;
  time_appointment?: string;

  paciente?: number;
  name_patient?: string;
  name_office?: string;
  address_office?: string;
  phone_office?: string;
  email_patient?: string;
  phone_patient?: string;
  patient_uuid?: string;
  comments?: string;

  tag_id?: number;
  tag_color?: string;
  tag_name?: string;

  consultation_count?: number;

  // campo que usamos para distinguir entre cita y bloqueo
  type: 'cita' | 'bloqueo';
}

@Component({
  selector: 'app-week-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './week-calendar.component.html',
  styleUrls: ['./week-calendar.component.scss']
})
export class WeekCalendarComponent implements OnChanges {
  @Input() currentDate: Date = new Date();

  @Output() solicitarRefrescoPadre = new EventEmitter<void>();

  today = new Date();
  weekDays: Date[] = [];
  weekLabel = '';
  startHour = 6;
  endHour = 22;
  showPopup = false;
  popupPosition = {
    x: 0,
    y: 0
  };
  popupCell: {
    row: number,
    col: number
  } | null = null;

  events: EventData[] = [];
  timeSlots: {
    hour: number;half: number;label: string
  } [] = [];

  activeTab: 'cita' | 'bloqueo' = 'cita';

  bloqueo = {
    name: '',
    date_start: '',
    date_end: '',
    time_start: '',
    time_end: ''
  };
  
  nuevoPaciente = {
    nombre: '',
    fecha_nacimiento: '',
    sexo: '',
    email: '',
    telefono: ''
  };

  showCreatePatient = false;

  detailPopupVisible = false;
  detailPopupPosition = { x: 0, y: 0 };
  selectedEvent: EventData | null = null;
  editingEvent: EventData | null = null;

  dragging = false;
  offset = {
    x: 0,
    y: 0
  };
  
  selectedDate: Date | null = null;
  endDateValue: Date | null = null;

  duraciones: number[] = [5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180];
  duracionSeleccionada: number = 30; // default 30 min

  etiquetas: any[] = [];
  etiquetaSeleccionada: number | null = null;

  guardando = false;
  submitted = false;
  
  busquedaPaciente: string = '';
  pacientesEncontrados: any[] = [];
  pacienteSeleccionado: any = null;

  dropdownOpen = false;
  selectedTag: any = null;

  comentarios: string = '';

  offices: any[] = [];
  selectedOfficeId: number | null = null;
  mediosContacto: Array<{ id_medio_contacto: number; nombre_medio: string }> = [];
  medioContactoSeleccionado: number | null = null;

  constructor(private appointmentService: AppointmentService, 
              private dialog: MatDialog ) {}

  ngOnChanges() {
    this.generateSlots();
    this.renderWeek(this.currentDate);
  }

  ngOnInit() {
    this.cargarEventos();
    this.cargarEtiquetas();
    this.cargarConsultorios();
    this.cargarMediosContacto();
  }

  notificarPadre() {
    this.solicitarRefrescoPadre.emit();
  }

  cargarEventosWeek(){
    this.cargarEventos();
  }

  cargarEtiquetas() {
    this.appointmentService.getEtiquetas().subscribe(res => {
      if (res.status) {
        this.etiquetas = res.tags;
      }
    });
  }

  cargarConsultorios() {
    this.appointmentService.getConsultorios().subscribe({
      next: (res) => {
        if (res.status && Array.isArray(res.offices) && res.offices.length > 0) {
          this.offices = res.offices;
          this.selectedOfficeId = res.offices[0].office_id; // 👉 primer consultorio
        }
      },
      error: (err) => {
        console.error("Error cargando consultorios:", err);
      }
    });
  }

  cargarMediosContacto() {
    this.appointmentService.getMediosContacto().subscribe({
      next: (res) => {
        if (res?.status && Array.isArray(res.medios_contacto)) {
          this.mediosContacto = res.medios_contacto;
        } else {
          this.mediosContacto = [];
        }
      },
      error: () => this.mediosContacto = []
    });
  }

  cargarEventos() {
    this.appointmentService.getCalendario().subscribe({
      next: (data) => {
        if (data.status && Array.isArray(data.appointments)) {
          this.events = data.appointments.map((ev: any) => ({
            id: ev.id,
            id_block: ev.id_block || undefined,
            title: ev.title,

            start: new Date(ev.start),
            end: new Date(ev.end),

            formatted_date_time: ev.formatted_date_time,
            formatted_time: ev.formatted_time,
            duration_appointment: ev.duration_appointment || null,
            date_appointment: ev.date_appointment || null,
            time_appointment: ev.time_appointment || null,

            paciente: ev.paciente || null,
            name_patient: ev.name_patient || "",
            name_office: ev.name_office || "",
            address_office: ev.address_office || "",
            phone_office: ev.phone_office || "",
            email_patient: ev.email_patient || "",
            phone_patient: ev.phone_patient || "",
            patient_uuid: ev.patient_uuid || "",
            comments: ev.comments || "",
            medio_contacto: ev.medio_contacto || 0,

            tag_id: ev.tag_id || null,
            tag_color: ev.tag_color || (ev.id_block ? "#edeff2" : "#004c80"),
            tag_name: ev.tag_name || "",

            consultation_count: ev.consultation_count || 0,

            // 👇 si tiene id_block lo consideramos bloqueo
            type: ev.id_block ? "bloqueo" : "cita",
          }));
        } else {
          this.events = [];
        }
      },
      error: (err) => {
        console.error("Error cargando eventos:", err);
        this.events = [];
      }
    });
  }

  openExistingEvent(ev: EventData, event: MouseEvent) {
    event.stopPropagation();
    this.showPopup = true;

    this.popupPosition = {
      x: event.clientX,
      y: event.clientY
    };
    this.activeTab = ev.type;

    setTimeout(() => {
      if (ev.type === 'cita') {
        const citaDate = document.querySelector < HTMLInputElement > (".event-popup .cita-date");
        const citaTime = document.querySelector < HTMLInputElement > (".event-popup .cita-time");

        if (citaDate) citaDate.value = ev.start.toISOString().split("T")[0];
        if (citaTime) citaTime.value =
          `${String(ev.start.getHours()).padStart(2, '0')}:${String(ev.start.getMinutes()).padStart(2, '0')}`;
      }

      if (ev.type === 'bloqueo') {
        const bloqueoStartDate = document.querySelector < HTMLInputElement > (".event-popup .bloqueo-start-date");
        const bloqueoStartTime = document.querySelector < HTMLInputElement > (".event-popup .bloqueo-start-time");
        const bloqueoEndDate = document.querySelector < HTMLInputElement > (".event-popup .bloqueo-end-date");
        const bloqueoEndTime = document.querySelector < HTMLInputElement > (".event-popup .bloqueo-end-time");

        if (bloqueoStartDate) bloqueoStartDate.value = ev.start.toISOString().split("T")[0];
        if (bloqueoStartTime) bloqueoStartTime.value =
          `${String(ev.start.getHours()).padStart(2, '0')}:${String(ev.start.getMinutes()).padStart(2, '0')}`;

        if (bloqueoEndDate) bloqueoEndDate.value = ev.end.toISOString().split("T")[0];
        if (bloqueoEndTime) bloqueoEndTime.value =
          `${String(ev.end.getHours()).padStart(2, '0')}:${String(ev.end.getMinutes()).padStart(2, '0')}`;
      }
    });
  }

  toggleCreatePatient(event: Event) {
    event.preventDefault();
    // limpiar lo seleccionado y búsqueda
    this.pacienteSeleccionado = null;
    this.busquedaPaciente = '';
    this.pacientesEncontrados = [];
    this.showCreatePatient = !this.showCreatePatient;
  }

  generateSlots() {
    this.timeSlots = [];
    for (let hour = this.startHour; hour < this.endHour; hour++) {
      for (let half = 0; half < 2; half++) {
        const label = `${hour % 12 === 0 ? 12 : hour % 12}:${half === 0 ? '00' : '30'} ${hour < 12 ? 'AM' : 'PM'}`;
        this.timeSlots.push({
          hour,
          half,
          label
        });
      }
    }
  }

  renderWeek(date: Date) {
    const {
      start,
      end
    } = this.getWeekRange(date);
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      this.weekDays.push(d);
    }
    this.weekLabel = `${start.getDate()} ${this.monthName(start)} - ${end.getDate()} ${this.monthName(end)}, ${start.getFullYear()}`;
  }

  getWeekRange(date: Date) {
    const day = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return {
      start: sunday,
      end: saturday
    };
  }

  monthName(d: Date) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return monthNames[d.getMonth()];
  }

  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.renderWeek(this.currentDate);
  }
  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.renderWeek(this.currentDate);
  }
  goToToday() {
    this.currentDate = new Date();
    this.renderWeek(this.currentDate);
  }

  openDialog(event: MouseEvent, row: number, col: number) {
    event.stopPropagation();
    this.showPopup = true;
    this.popupCell = { row, col };

    const day = this.weekDays[col];
    const slot = this.timeSlots[row];
    this.selectedDate = new Date(day);
    this.selectedDate.setHours(slot.hour, slot.half === 0 ? 0 : 30);
    this.endDateValue = new Date(this.selectedDate);
    this.endDateValue.setMinutes(this.endDateValue.getMinutes() + 30);

    this.bloqueo = {
      name: this.editingEvent?.title || '',
      date_start: this.formatDate(this.selectedDate),
      time_start: this.formatTime(this.selectedDate),
      date_end: this.formatDate(this.endDateValue),
      time_end: this.formatTime(this.endDateValue)
    };
    
    this.closeDetailPopup();
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private formatTime(d: Date): string {
    return d.toTimeString().slice(0, 5); // HH:mm
  }

  closePopup() {
    this.showPopup = false;
    this.popupCell = null;
    this.editingEvent = null;
    this.submitted = false;
    this.guardando = false;

    // 🔹 Resetear cita
    this.selectedDate = null;
    this.endDateValue = null;
    this.duracionSeleccionada = 30;
    this.etiquetaSeleccionada = null;
    this.selectedTag = null;
    this.comentarios = '';

    // 🔹 Resetear paciente
    this.pacienteSeleccionado = null;
    this.showCreatePatient = false;
    this.busquedaPaciente = '';
    this.pacientesEncontrados = [];
    this.nuevoPaciente = {
      nombre: '',
      fecha_nacimiento: '',
      sexo: '',
      email: '',
      telefono: ''
    };

    // 🔹 Resetear bloqueo
    this.bloqueo = {
      name: '',
      date_start: '',
      date_end: '',
      time_start: '',
      time_end: ''
    };

    // 🔹 Resetear consultorio seleccionado (si aplica)
    this.selectedOfficeId = this.offices.length > 0 ? this.offices[0].office_id : null;

    this.etiquetaSeleccionada = null;
    this.selectedTag = null;
    this.medioContactoSeleccionado = null;
  }


  saveEvent(type: 'cita' | 'bloqueo') {
    if (type === 'bloqueo') {
      this.submitted = true;

      if (!this.bloqueo.name || !this.bloqueo.date_start || !this.bloqueo.time_start ||
          !this.bloqueo.date_end || !this.bloqueo.time_end) {
        return; // no guarda si faltan campos
      }

      this.guardando = true;
      this.appointmentService.guardarBloqueo(
        this.editingEvent?.id_block || 0,
        this.bloqueo.name,
        this.bloqueo.date_start,
        this.bloqueo.date_end,
        this.bloqueo.time_start,
        this.bloqueo.time_end
      ).subscribe({
        next: (res) => {
          this.guardando = false;
          if (res.status) {
            this.submitted = false; // reset
            this.closePopup();
            this.cargarEventos();
            this.notificarPadre();
          } else {
            alert('Error: ' + res.message);
          }
        },
        error: () => {
          this.guardando = false;
          alert('Error de conexión al guardar bloqueo');
        }
      });
    }else if (type === 'cita') {
      this.submitted = true;

      let valido = false;

      // Paciente existente
      if (this.pacienteSeleccionado) {
        valido = true;
      } 
      // Nuevo paciente
      else if (this.showCreatePatient) {
        if (
          this.nuevoPaciente?.nombre && 
          this.nuevoPaciente?.telefono &&
          this.nuevoPaciente?.sexo
        ) {
          valido = true;
        }
      }

      // Validación final
      if (
        !valido ||
        !this.selectedDate ||
        !this.duracionSeleccionada ||
        !this.etiquetaSeleccionada ||
        !this.medioContactoSeleccionado
      ) {
        return;
      }

      // ✅ si pasa validaciones, llamar a tu servicio de guardar cita
      this.guardando = true;
      this.appointmentService.guardarCita({
        id: this.editingEvent?.id || 0,
        patient_id: this.pacienteSeleccionado?.id_paciente || 0,
        office_id: this.selectedOfficeId,
        dia_cita: this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : '',
        hora_cita: this.selectedDate ? this.selectedDate.toTimeString().slice(0,5) : '',
        duration: this.duracionSeleccionada,
        tag: this.etiquetaSeleccionada,
        medio_contacto: this.medioContactoSeleccionado,
        comments: this.comentarios?.trim() || '',
        new_patient: this.showCreatePatient
        ? {
            name: this.nuevoPaciente.nombre,
            email: this.nuevoPaciente.email || '',
            phone: this.nuevoPaciente.telefono,
            birthdate: this.nuevoPaciente.fecha_nacimiento || '',
            gender: this.nuevoPaciente.sexo
          }
        : null,
        }).subscribe({
          next: (res) => {
            this.guardando = false;

            this.dialog.open(DialogAvisoComponent, {
              width: '420px',
              data: {
                titulo: res.status ? 'Cita guardada' : 'Error',
                mensaje: res.message || (res.status ? 'La cita se guardó correctamente.' : 'No se pudo completar la acción.'),
                tipo: res.status ? 'success' : 'error'
              }
            });

            if (res.status) {
              this.submitted = false;

              // 🔹 Reiniciar campos
              this.comentarios = '';
              this.etiquetaSeleccionada = null;
              this.pacienteSeleccionado = null;
              this.nuevoPaciente = {
                nombre: '',
                fecha_nacimiento: '',
                sexo: '',
                email: '',
                telefono: ''
              };
              this.busquedaPaciente = '';
              this.showCreatePatient = false;

              this.closePopup();
              this.cargarEventos();
              this.notificarPadre();
            }
          },
          error: () => {
            this.guardando = false;
            this.dialog.open(DialogAvisoComponent, {
              width: '420px',
              data: {
                titulo: 'Error de conexión',
                mensaje: 'No se pudo conectar con el servidor al guardar la cita.',
                tipo: 'error'
              }
            });
          }
        });


    }
  }

  getEventsForCell(day: Date, hour: number, half: number) {
    const cellStart = new Date(day);
    cellStart.setHours(hour, half === 0 ? 0 : 30, 0, 0);

    return this.events.filter(ev =>
      // 👉 Solo dibujar el evento en su primera celda
      ev.start.getTime() === cellStart.getTime()
    );
  }

  onDragStart(event: MouseEvent) {
    event.preventDefault();
    this.dragging = true;

    const popup = document.querySelector('.event-popup') as HTMLElement;
    if (popup) {
      const rect = popup.getBoundingClientRect();
      this.offset.x = event.clientX - rect.left;
      this.offset.y = event.clientY - rect.top;
    }

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  onDragMove = (event: MouseEvent) => {
    if (!this.dragging) return;

    const popup = document.querySelector('.event-popup') as HTMLElement;
    if (popup) {
      popup.style.left = event.clientX - this.offset.x + 'px';
      popup.style.top = event.clientY - this.offset.y + 'px';
      popup.style.right = 'auto'; // para evitar que se quede fijo
    }
  };

  onDragEnd = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };

  getEventsForDay(day: Date): EventData[] {
    return this.events.filter(e => e.start.toDateString() === day.toDateString());
  }

  getEventTop(ev: EventData): number {
    const startMinutes = ev.start.getHours() * 60 + ev.start.getMinutes();
    const calendarMinutes = this.startHour * 60;
    const diffMinutes = startMinutes - calendarMinutes;
    return (diffMinutes / 30) * 50; // 50px por slot de 30min
  }

  getEventHeight(ev: EventData): number {
    const duration = (ev.end.getTime() - ev.start.getTime()) / 60000;
    return (duration / 30) * 50;
  }

  openDetailPopup(ev: EventData, event: MouseEvent) {
    this.selectedEvent = ev;
    this.detailPopupVisible = true;

    const margin = 10;

    // esperar a que Angular pinte el popup
    setTimeout(() => {
      const popupEl = document.querySelector('.detail-popup') as HTMLElement;
      if (popupEl) {
        const popupWidth = popupEl.offsetWidth || 260;  // fallback 260
        const popupHeight = popupEl.offsetHeight || 180; // fallback 180

        let x = event.clientX + margin;
        let y = event.clientY + margin;

        if (x + popupWidth > window.innerWidth) {
          x = event.clientX - popupWidth - margin;
        }
        if (y + popupHeight > window.innerHeight) {
          y = event.clientY - popupHeight - margin;
        }

        this.detailPopupPosition = { x, y };
      }
    });
  }

  closeDetailPopup() {
    this.detailPopupVisible = false;
    this.selectedEvent = null;
  }

  editEvent(ev: any) {
    this.showPopup = true;            // abre el sheet lateral
    this.activeTab = ev.type;         // activa la pestaña correcta (cita/bloqueo)
    this.submitted = false;
    this.editingEvent = ev;

    if (ev.type === 'cita') {
      // paciente
      this.pacienteSeleccionado = {
        id_paciente: ev.paciente,
        nombre_paciente: ev.name_patient,
        phone: ev.phone_patient,
        email: ev.email_patient
      };

      // fecha y hora
      this.selectedDate = new Date(ev.start);

      this.duracionSeleccionada = ev.duration_appointment || null;

      // etiqueta
      this.etiquetaSeleccionada = ev.tag_id || null;
      this.selectedTag = {
        tag_name: ev.tag_name,
        color: ev.tag_color
      };

      // comentarios
      this.comentarios = ev.comments || '';

      console.log(ev);

      this.medioContactoSeleccionado = (ev.medio_contacto ?? null);
    }

    if (ev.type === 'bloqueo') {
      this.bloqueo = {
        name: ev.title,
        date_start: this.formatDate(ev.start),
        time_start: this.formatTime(ev.start),
        date_end: this.formatDate(ev.end),
        time_end: this.formatTime(ev.end)
      };
    }
  }

  deleteEvent(ev: EventData) {
    this.closeDetailPopup();
    
    if (ev.type === 'bloqueo' && ev.id_block) {
      const dialogRef = this.dialog.open(DialogConfirmarComponent, {
        width: '420px',
        data: {
          titulo: 'Eliminar bloqueo',
          mensaje: '¿Estás seguro de que deseas eliminar este bloqueo?',
          textoConfirmar: 'Sí, eliminar',
          textoCancelar: 'Cancelar'
        }
      });

      dialogRef.afterClosed().subscribe(resultado => {
        if (resultado) {
          this.appointmentService.eliminarBloqueo(ev.id_block!).subscribe({
            next: (res) => {
              if (res.status) {
                this.closeDetailPopup();
                this.notificarPadre();
                this.cargarEventos();
              } else {
                this.dialog.open(DialogAvisoComponent, {
                  width: '420px',
                  data: {
                    tipo: 'error',
                    titulo: 'Error',
                    mensaje: res.message || 'No se pudo eliminar el bloqueo'
                  }
                });
              }
            },
            error: () => {
              this.dialog.open(DialogAvisoComponent, {
                width: '420px',
                data: {
                  tipo: 'error',
                  titulo: 'Error',
                  mensaje: 'Error de conexión con el servidor'
                }
              });
            }
          });
        }
      });
    }

    // 🔹 Si es una cita
    if (ev.type === 'cita' && ev.id) {
      const dialogRef = this.dialog.open(DialogConfirmarComponent, {
        width: '420px',
        data: {
          titulo: 'Cancelar cita',
          mensaje: '¿Estás seguro de que deseas cancelar esta cita?',
          textoConfirmar: 'Sí, cancelar',
          textoCancelar: 'No'
        }
      });

      dialogRef.afterClosed().subscribe(resultado => {
        if (resultado) {
          this.appointmentService.cambiarEstadoCita(ev.id!, 'Cancelada').subscribe({
            next: (res) => {
              if (res.status) {
                this.closeDetailPopup();
                this.notificarPadre();
                this.cargarEventos();
              } else {
                this.dialog.open(DialogAvisoComponent, {
                  width: '420px',
                  data: {
                    tipo: 'error',
                    titulo: 'Error',
                    mensaje: res.message || 'No se pudo cancelar la cita'
                  }
                });
              }
            },
            error: () => {
              this.dialog.open(DialogAvisoComponent, {
                width: '420px',
                data: {
                  tipo: 'error',
                  titulo: 'Error',
                  mensaje: 'Error de conexión con el servidor'
                }
              });
            }
          });
        }
      });
    }
  }
  
  buscarPacientes() {
    if (this.busquedaPaciente.trim().length < 2) {
      this.pacientesEncontrados = [];
      return;
    }

    this.appointmentService.buscarPacientes(this.busquedaPaciente).subscribe({
      next: (res) => {
        if (res.status) {
          this.pacientesEncontrados = res.patients;
        } else {
          this.pacientesEncontrados = [];
        }
      },
      error: () => {
        this.pacientesEncontrados = [];
      }
    });
  }

  seleccionarPaciente(p: any) {
    this.pacienteSeleccionado = p;
    this.busquedaPaciente = '';
    this.pacientesEncontrados = [];
  }

  toggleTagDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTag(tag: any, event: MouseEvent) {
    event.stopPropagation();
    this.selectedTag = tag;
    this.etiquetaSeleccionada = tag.tag_id;
    this.dropdownOpen = false;
  }

  normalizeColor(color: string): string {
    if (!color) return '#dcdfe3'; // fallback
    const hex = color.startsWith('#') ? color.toLowerCase() : `#${color.toLowerCase()}`;

    // Si es blanco o muy claro -> usar gris clarito en lugar de blanco
    if (hex === '#fff' || hex === '#ffffff') {
      return '#f1f3f4'; // gris Google claro
    }

    return hex;
  }


  getTextColor(bgColor: string): string {
    if (!bgColor) return '#000';
    const hex = this.normalizeColor(bgColor).substring(1);
    const rgb = parseInt(hex, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    // Si es muy claro, usamos texto oscuro
    return luma > 220 ? '#333' : '#fff';
  }

  abrirAgendarCita() {
    this.selectedDate = this.selectedDate || new Date(); 
    this.showPopup = true;
    this.activeTab = 'cita';
    this.closeDetailPopup();
  }

  abrirDetalleCita(ev: any, event: MouseEvent) {
    event.stopPropagation(); 

    if (ev.type === 'cita') {

      if(ev.consultation_count == 0){
        window.open(`/admin/patients?id=${ev.paciente}`, "_blank"); 
      }else{
        window.open(`/admin/appointments?id=${ev.id}`, "_blank"); 
      }
    } else {
      
    }
  }

  llamarPaciente(ev: EventData) {
    if (ev.phone_patient) {
      window.open(`tel:${ev.phone_patient}`, "_self"); 
    } else {
      alert("Este paciente no tiene teléfono registrado");
    }
  }

  whatsappPaciente(ev: EventData) {
    if (ev.phone_patient) {
      const phone = ev.phone_patient.replace(/\D/g, ""); // limpiar a solo números
      window.open(`https://wa.me/52${phone}`, "_blank"); 
    } else {
      alert("Este paciente no tiene número de WhatsApp registrado");
    }
  }

  abrirRecetas(ev: EventData) {
    if (ev.id) {
      // 👉 Ajusta esta URL según tu sistema real de expedientes
      window.open(`/admin/patients.prescriptions?id=${ev.paciente}`, "_blank");
    } else {
      alert("No se encontró el expediente de este paciente");
    }
  }

  abrirExpediente(ev: EventData) {
    if (ev.id) {
      // 👉 Ajusta esta URL según tu sistema real de expedientes
      window.open(`/admin/patients?id=${ev.paciente}`, "_blank");
    } else {
      alert("No se encontró el expediente de este paciente");
    }
  }

}
