import React from 'react';
import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  return <Navigate to="/toolkit/nmap" replace />;
}