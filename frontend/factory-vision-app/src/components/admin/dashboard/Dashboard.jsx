import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Layout, ChevronLeft, LayoutDashboard, Database, Settings, ChevronDown, Menu, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import KPIStatCard from './KPIStatCard';
import axios from '../../../api/api';

export default function Dashboard({ setActiveTab }) {

    const [stats, setStats] = useState(null);

    useEffect(() => {
    fetchStats();
    }, []);

    const fetchStats = async () => {
    try {

        const token = localStorage.getItem('token');

        const response = await axios.get(
        '/api/admin/dashboard/stats',
        {
            headers: {
            Authorization: `Bearer ${token}`
            }
        }
        );

        setStats(response.data);

    } catch (err) {
        console.error(err);
    }
    };

  const statsData = [
    {
      title: 'Total Inspections',
      value: stats ? stats.total_inspections : 'Loading...',
      icon: ShieldCheck,
      color: 'blue',
      link: 'inspections'
    },
    {
      title: 'Pass Rate',
      value: stats ? `${stats.pass_rate}%` : 'Loading...',
      icon: Database,
      color: 'green',
      link: 'inspections'
    },
    {
      title: 'Active Operators',
      value: stats ? stats.active_operators : 'Loading...',
      icon: Users,
      color: 'purple',
      link: 'users'
    },
    {
      title: 'Critical Errors',
      value: stats ? stats.critical_errors.length : 'Loading...',
      icon: AlertTriangle,
      color: 'red',
      link: 'inspections'
    }
  ];

  return (
    <div className="space-y-8">

      {/* heading */}
      <div>
        <h1 className="text-3xl font-light mb-2">
          System Overview
        </h1>

        <p className="text-sm text-white/40">
          Monitoring and analytics for inspection operations.
        </p>
      </div>

      {/* KPI GRID */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>

            <h2 className="text-xl font-bold tracking-wide uppercase">
            Operational Metrics
            </h2>
        </div>
      </div>
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-6
      ">
        {statsData.map((stat, index) => (
          <KPIStatCard
            setActiveTab={setActiveTab}
            key={index}
            {...stat}
          />
        ))}
      </div>

    </div>
  );
}