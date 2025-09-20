export const API_BASE_URL = 'https://dradscare.com/admin/api/';

export const API_ENDPOINTS = {
  validarUuid: `${API_BASE_URL}/api.validar_uuid.php`,
  getCalendario: `${API_BASE_URL}/api.get_calendario.php`,
  getProximasCitas: `${API_BASE_URL}/api.get_proximas_citas.php`,
  getEtiquetas: `${API_BASE_URL}/api.get_etiquetas.php`,
  cambiarEstadoCita: `${API_BASE_URL}/api.cambiar_estado_cita.php`,
  guardarBloqueo: `${API_BASE_URL}/api.guardar_bloqueo.php`,
  eliminarBloqueo: `${API_BASE_URL}/api.eliminar_bloqueo.php`,
  buscarPaciente: `${API_BASE_URL}/api.buscar_paciente.php`,
  guardarCita: `${API_BASE_URL}/api.guardar_cita.php`,
  getConsultorios: `${API_BASE_URL}/api.get_consultorios.php`,
};
