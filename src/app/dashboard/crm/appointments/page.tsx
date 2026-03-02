'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/lib/types';
import { AutomationService } from '@/services/automation';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    async function fetchAppointments() {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
        } else {
            setAppointments(data || []);
        }
        setIsLoading(false);
    }

    async function updateStatus(id: string, status: string) {
        const appointment = appointments.find(a => a.id === id);

        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);

        if (error) {
            alert('Failed to update status: ' + error.message);
        } else {
            // Trigger automation notification
            if (appointment) {
                await AutomationService.notifyAppointmentStatus(appointment, status);
            }
            fetchAppointments();
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center">Loading appointments...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your upcoming bookings and requests.</p>
                </div>
                <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    New Appointment
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Service
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Time
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.length > 0 ? appointments.map((apt) => (
                            <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {(apt.customer_name || 'G').charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{apt.customer_name || 'Guest'}</div>
                                            <div className="text-sm text-gray-500">{apt.customer_phone || apt.customer_email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {apt.service_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(apt.start_time).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border 
                                        ${apt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                            apt.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {apt.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(apt.id, 'confirmed')}
                                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors mr-3"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {apt.status !== 'cancelled' && (
                                        <button
                                            onClick={() => updateStatus(apt.id, 'cancelled')}
                                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    No appointments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
