"use client";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { User, PaginatedTotal } from "@vitalfit/sdk";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isAfter, isBefore, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "@/i18n/navigation";

// Interfaz para las reservas
interface Booking {
  booking_id: string;
  class_id: string;
  starts_at: string;
  ends_at: string;
  service_name: string;
  instructor: string;
  branch_name: string;
}

export default function Reservations() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [instructorFilter, setInstructorFilter] = useState<string>("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [clients, setClients] = useState<User[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueInstructors, setUniqueInstructors] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState<string>("");
  const router = useRouter();
  const { token } = useAuth();

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) {
      return clients;
    }

    const searchLower = clientSearch.toLowerCase();
    return clients.filter(client =>
      client.first_name.toLowerCase().includes(searchLower) ||
      client.last_name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.user_id.toLowerCase().includes(searchLower)
    );
  }, [clients, clientSearch]);

  const loadClients = async () => {
    if (!token) {
      return;
    }

    setIsLoadingClients(true);
    try {
      const response = await api.user.getClientUsers(token, {
        role: "client",
        limit: 2000,
        page: 1,
        sort: "asc"
      });

      const paginatedResponse = response as PaginatedTotal<User[]>;
      setClients(paginatedResponse.data || []);
    } catch (error) {
      console.warn("Error loading clients:", error);
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const extractUniqueInstructors = (bookingsList: Booking[]) => {
    const instructors = bookingsList.map(booking => booking.instructor);
    const unique = Array.from(new Set(instructors)).sort();
    setUniqueInstructors(unique);
  };

  const loadUserBookings = async (userId: string) => {
    if (!token || !userId || userId === "all") {
      resetBookingStates();
      return;
    }

    setIsLoadingBookings(true);
    try {
      const bookingsResponse = await api.booking.getClientBooking(userId, token);
      const bookingsData = bookingsResponse.data || [];
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);

      extractUniqueInstructors(bookingsData);

      const client = clients.find(client => client.user_id === userId);

      setShowFilters(bookingsData.length > 0);

      setInstructorFilter("");
      setFromDate("");
      setToDate("");
      setFiltersApplied(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      resetBookingStates();
      alert("Error al cargar las reservas del cliente");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const resetBookingStates = () => {
    setBookings([]);
    setFilteredBookings([]);
    setShowFilters(false);
    setUniqueInstructors([]);
    setInstructorFilter("");
    setFromDate("");
    setToDate("");
    setFiltersApplied(false);
  };

  const resetAllStates = () => {
    setSelectedUserId("");
    setClientSearch("");
    resetBookingStates();
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);

    if (userId && userId !== "all") {
      await loadUserBookings(userId);
    } else {
      resetBookingStates();
    }
  };

  const applyFilters = () => {
    let result = [...bookings];

    if (instructorFilter) {
      result = result.filter(booking =>
        booking.instructor.toLowerCase().includes(instructorFilter.toLowerCase())
      );
    }

    if (fromDate) {
      const from = parse(fromDate, "yyyy-MM-dd", new Date());
      result = result.filter(booking => {
        const bookingDate = parseISO(booking.starts_at);
        return isAfter(bookingDate, from) || bookingDate.getDate() === from.getDate();
      });
    }

    if (toDate) {
      const to = parse(toDate, "yyyy-MM-dd", new Date());
      result = result.filter(booking => {
        const bookingDate = parseISO(booking.starts_at);
        return isBefore(bookingDate, to) || bookingDate.getDate() === to.getDate();
      });
    }

    setFilteredBookings(result);
    setFiltersApplied(true);
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      if (durationMinutes < 60) {
        return `${durationMinutes} min`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
      }
    } catch (error) {
      return "N/A";
    }
  };

  const clearFilters = () => {
    setInstructorFilter("");
    setFromDate("");
    setToDate("");
    setFilteredBookings(bookings);
    setFiltersApplied(false);
  };

  const clearAll = () => {
    resetAllStates();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEEE, dd MMMM", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    loadClients();
  }, [token]);

  // Calcular estadísticas dinámicas - Inicializadas en 0
  const totalClasses = selectedUserId ? filteredBookings.length : 0;
  const totalReservations = selectedUserId ? filteredBookings.length : 0;
  const availableSpots = selectedUserId ? 0 : 0;
  const averageOccupancy = selectedUserId && filteredBookings.length > 0 ? 85 : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Clases"
            value={totalClasses}
          />
          <StatCard
            title="Reservas Totales"
            value={totalReservations}
          />
          <StatCard
            title="Cupos Disponibles"
            value={<span className={`${selectedUserId ? "text-green-400" : "text-gray-400"}`}>
              {availableSpots}
            </span>}
          />
          <StatCard
            title="Ocupación Promedio"
            value={<span className={`${selectedUserId && totalClasses > 0 ? "text-red-400" : "text-gray-400"}`}>
              {averageOccupancy.toFixed(1)}%
            </span>}
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          RESERVAS POR BLOQUE
        </h1>
        <p className="mb-6">Encuentra todos los clientes reservados por clase</p>

        <div className="filters my-6 bg-white p-4 rounded-lg border shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Cliente
              </label>
              <Select
                value={selectedUserId}
                onValueChange={handleUserSelect}
                disabled={isLoadingClients}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2 truncate">
                    <UserIcon className="h-4 w-4 flex-shrink-0" />
                    <SelectValue placeholder="Selecciona un cliente" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="sticky top-0 z-10 bg-white p-2 border-b">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-10 h-9"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {filteredClients.length} de {clients.length} clientes
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-64">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2 py-2">
                        <XMarkIcon className="h-4 w-4 text-gray-500" />
                        <span>Limpiar selección</span>
                      </div>
                    </SelectItem>

                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <SelectItem
                          key={client.user_id}
                          value={client.user_id}
                          className="truncate hover:bg-gray-50"
                        >
                          <div className="flex flex-col py-1">
                            <span className="font-medium truncate">
                              {client.first_name} {client.last_name}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {client.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-500 text-sm">
                        No se encontraron clientes
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por instructor
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Nombre del instructor..."
                        value={instructorFilter}
                        onChange={(e) => setInstructorFilter(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10"
                      />
                    </div>
                    {uniqueInstructors.length > 0 && instructorFilter && (
                      <div className="mt-1 text-xs text-gray-500">
                        Instructores disponibles: {uniqueInstructors.join(", ")}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desde
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hasta
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="pl-10"
                        min={fromDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={applyFilters}
                    className="flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filtrar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!filtersApplied && !instructorFilter && !fromDate && !toDate}
                    className="flex items-center gap-2"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Limpiar filtros
                  </Button>
                </div>
              </div>

              {(filtersApplied || instructorFilter || fromDate || toDate) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <FunnelIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Filtros activos:</span>
                      {instructorFilter && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Instructor: {instructorFilter}
                        </span>
                      )}
                      {fromDate && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Desde: {format(parse(fromDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                        </span>
                      )}
                      {toDate && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Hasta: {format(parse(toDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Reservaciones
              </h3>
              <p className="text-sm text-gray-500">
                {selectedUserId ? (
                  <>
                    Mostrando {filteredBookings.length} de {bookings.length} reservas
                    {filtersApplied && filteredBookings.length !== bookings.length && (
                      <span className="text-orange-600 ml-1">
                        (filtradas)
                      </span>
                    )}
                  </>
                ) : (
                  "Selecciona un cliente para ver sus reservas"
                )}
              </p>
            </div>
            {selectedUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Limpiar selección
              </Button>
            )}
          </div>

          {isLoadingBookings ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedUserId && filteredBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    {/* Header de la reserva */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {booking.service_name}
                        </p>
                        <p className="text-sm text-gray-600">{booking.instructor}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDate(booking.starts_at)}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-gray-700">
                            <ClockIcon className="h-4 w-4 text-gray-500" />
                            <span>
                              {formatTime(booking.starts_at)} - {formatTime(booking.ends_at)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({calculateDuration(booking.starts_at, booking.ends_at)})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Sucursal</p>
                          <p className="font-medium text-gray-900">{booking.branch_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.replace(`/operations/reservations/${booking.booking_id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : selectedUserId && selectedUserId !== "all" ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filtersApplied ? "No hay reservas con los filtros aplicados" : "No hay reservas encontradas"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {filtersApplied
                  ? "Intenta ajustar los filtros para encontrar reservas que coincidan con tus criterios."
                  : "El cliente seleccionado no tiene reservas activas."}
              </p>
              {filtersApplied && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un cliente
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Por favor, selecciona un cliente de la lista para ver sus reservas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}