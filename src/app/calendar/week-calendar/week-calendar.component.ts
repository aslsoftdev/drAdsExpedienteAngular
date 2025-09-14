import {
  Component,
  Input,
  OnChanges
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';

interface EventData {
  id: number;
  id_block?: number; // para bloqueos que no traen id normal
  title: string;

  start: Date;
  end: Date;

  formatted_date_time?: string;
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
  imports: [CommonModule],
  templateUrl: './week-calendar.component.html',
  styleUrls: ['./week-calendar.component.scss']
})
export class WeekCalendarComponent implements OnChanges {
  @Input() currentDate: Date = new Date();

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
  showCreatePatient = false;

  detailPopupVisible = false;
  detailPopupPosition = { x: 0, y: 0 };
  selectedEvent: EventData | null = null;

  dragging = false;
  offset = {
    x: 0,
    y: 0
  };
  
  selectedDate: Date | null = null;
  endDateValue: Date | null = null;

  ngOnChanges() {
    this.generateSlots();
    this.renderWeek(this.currentDate);
  }

  ngOnInit() {
    this.loadEvents(); // 👈 aquí cargas las citas/bloqueos desde la API
  }

  async loadEvents() {
    try {
      const res = await fetch(
        "https://dradscarerecords.com/admin_migracion/api/api.get_calendar.php?uuid=b52b2b8d-0328-11ef-b86a-6a3d6524d860"
      );
      const data = await res.json();

      if (data.status && Array.isArray(data.appointments)) {
        this.events = data.appointments.map((ev: any) => ({
          id: ev.id,
          id_block: ev.id_block || undefined,
          title: ev.title,

          start: new Date(ev.start),
          end: new Date(ev.end),

          formatted_date_time: ev.formatted_date_time,
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

          tag_id: ev.tag_id || null,
          tag_color: ev.tag_color || (ev.id_block ? "#edeff2" : "#004c80"),
          tag_name: ev.tag_name || "",

          consultation_count: ev.consultation_count || 0,

          // 👇 si tiene id_block lo consideramos bloqueo
          type: ev.id_block ? "bloqueo" : "cita",
        }));
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    }
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

  openPopup(event: MouseEvent, row: number, col: number) {
    event.stopPropagation();
    this.showPopup = true;
    this.popupCell = {
      row,
      col
    };

    setTimeout(() => {
      const popup = document.querySelector('.event-popup') as HTMLElement;
      if (!popup) return;

      const rect = popup.getBoundingClientRect();
      const margin = 10;

      let x = event.clientX + margin;
      let y = event.clientY + margin;

      // 👉 si no cabe a la derecha, abre a la izquierda
      if (x + rect.width > window.innerWidth) {
        x = event.clientX - rect.width - margin;
      }

      // 👉 si no cabe a la izquierda, lo ajusta al borde
      if (x < 0) {
        x = margin;
      }

      // 👉 si no cabe abajo, abre hacia arriba
      if (y + rect.height > window.innerHeight) {
        y = event.clientY - rect.height - margin;
      }

      // 👉 si no cabe arriba, lo ajusta al borde
      if (y < 0) {
        y = margin;
      }

      this.popupPosition = {
        x,
        y
      };

      // 👉 Obtener fecha y hora seleccionadas
      const day = this.weekDays[col];
      const slot = this.timeSlots[row];

      this.selectedDate = new Date(day);
      this.selectedDate.setHours(slot.hour, slot.half === 0 ? 0 : 30);

      this.endDateValue = new Date(this.selectedDate);
      this.endDateValue.setMinutes(this.endDateValue.getMinutes() + 30);

      this.closeDetailPopup();
    });
  }


  closePopup() {
    this.showPopup = false;
    this.popupCell = null;
  }

  saveEvent(title: string, type: 'cita' | 'bloqueo') {
    if (this.popupCell) {
      const day = this.weekDays[this.popupCell.col];
      const slot = this.timeSlots[this.popupCell.row];
      const start = new Date(day);
      start.setHours(slot.hour, slot.half === 0 ? 0 : 30, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      this.events.push({
        id: Date.now(),
        title,
        type,
        start,
        end
      });
    }
    this.closePopup();
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
    const popupWidth = 260;
    const popupHeight = 180;

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

  closeDetailPopup() {
    this.detailPopupVisible = false;
    this.selectedEvent = null;
  }

  editEvent(ev: EventData) {
    this.closeDetailPopup(); // cerrar el detalle

    /*
    this.showPopup = true; // abrir popup edición
    this.activeTab = ev.type;

    setTimeout(() => {
      if (ev.type === 'cita') {
        const citaDate = document.querySelector<HTMLInputElement>(".event-popup .cita-date");
        const citaTime = document.querySelector<HTMLInputElement>(".event-popup .cita-time");
        if (citaDate) citaDate.value = ev.start.toISOString().split("T")[0];
        if (citaTime) citaTime.value =
          `${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}`;
      } else if (ev.type === 'bloqueo') {
        const bloqueoStartDate = document.querySelector<HTMLInputElement>(".event-popup .bloqueo-start-date");
        const bloqueoStartTime = document.querySelector<HTMLInputElement>(".event-popup .bloqueo-start-time");
        const bloqueoEndDate = document.querySelector<HTMLInputElement>(".event-popup .bloqueo-end-date");
        const bloqueoEndTime = document.querySelector<HTMLInputElement>(".event-popup .bloqueo-end-time");
        if (bloqueoStartDate) bloqueoStartDate.value = ev.start.toISOString().split("T")[0];
        if (bloqueoStartTime) bloqueoStartTime.value =
          `${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}`;
        if (bloqueoEndDate) bloqueoEndDate.value = ev.end?.toISOString().split("T")[0] || "";
        if (bloqueoEndTime && ev.end) bloqueoEndTime.value =
          `${String(ev.end.getHours()).padStart(2,'0')}:${String(ev.end.getMinutes()).padStart(2,'0')}`;
      }
    });*/
  }

  deleteEvent(ev: EventData) {
    /*if (!confirm("¿Seguro que deseas eliminar este evento?")) return;

    this.events = this.events.filter(e =>
      !(e.id === ev.id && e.type === ev.type)
    );*/

    this.closeDetailPopup();
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

  abrirExpediente(ev: EventData) {
    if (ev.patient_uuid) {
      // 👉 Ajusta esta URL según tu sistema real de expedientes
      window.open(`/expediente/${ev.patient_uuid}`, "_blank");
    } else {
      alert("No se encontró el expediente de este paciente");
    }
  }
}
