interface AgendaFiltersProps {
  onFilterChange: (filters: {
    estado?: string;
    responsable?: string;
    planta?: string;
    categoria?: string;
  }) => void;
}

export default function AgendaFilters({ onFilterChange }: AgendaFiltersProps) {
  const [filtros, setFiltros] = useState({
    estado: "",
    responsable: "",
    planta: "",
    categoria: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
    onFilterChange({ ...filtros, [name]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Estado
        </label>
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Bloqueado">Bloqueado</option>
          <option value="Completado">Completado</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Responsable
        </label>
        <select
          name="responsable"
          value={filtros.responsable}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todos</option>
          <option value="Responsable A">Responsable A</option>
          <option value="Responsable B">Responsable B</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Planta
        </label>
        <select
          name="planta"
          value={filtros.planta}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todas</option>
          <option value="Campana">Campana</option>
          <option value="Luján">Luján</option>
          <option value="General">General</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Categoría
        </label>
        <select
          name="categoria"
          value={filtros.categoria}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todas</option>
          <option value="Resguardo de información">Resguardo de información</option>
          <option value="Muestras de Campana">Muestras de Campana</option>
          <option value="Certificados de calibración">Certificados de calibración</option>
          <option value="Layout">Layout</option>
          <option value="Seguridad vial">Seguridad vial</option>
          <option value="Administración">Administración</option>
          <option value="Muestreo">Muestreo</option>
          <option value="Control de calidad">Control de calidad</option>
          <option value="Documentación del laboratorio">Documentación del laboratorio</option>
        </select>
      </div>
    </div>
  );
}