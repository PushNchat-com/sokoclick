import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { ErrorMonitoring, SystemHealth, ErrorSeverity, SystemError } from '../../services/core/ErrorMonitoring';
import { PerformanceMonitor, PerformanceMetric } from '../../services/core/PerformanceMonitor';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';

interface SystemHealthMonitorProps {
  onErrorsDetected?: (count: number) => void;
  refreshInterval?: number; // in milliseconds
  className?: string;
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  onErrorsDetected,
  refreshInterval = 60000, // Default to 1 minute
  className = ''
}) => {
  const { t } = useLanguage();
  const { user } = useUnifiedAuth();
  const [healthStatus, setHealthStatus] = useState<SystemHealth | null>(null);
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [slowOperations, setSlowOperations] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'errors' | 'performance' | null>(null);
  
  // Text content
  const text = {
    title: { en: 'System Health', fr: 'Santé du Système' },
    status: { en: 'Status', fr: 'Statut' },
    healthy: { en: 'Healthy', fr: 'En bonne santé' },
    degraded: { en: 'Degraded', fr: 'Dégradé' },
    unhealthy: { en: 'Unhealthy', fr: 'En mauvais état' },
    criticalErrors: { en: 'Critical Errors', fr: 'Erreurs Critiques' },
    warnings: { en: 'Warnings', fr: 'Avertissements' },
    performanceIssues: { en: 'Performance Issues', fr: 'Problèmes de Performance' },
    loading: { en: 'Loading system health data...', fr: 'Chargement des données de santé du système...' },
    refresh: { en: 'Refresh', fr: 'Actualiser' },
    autoRefresh: { en: 'Auto Refresh', fr: 'Actualisation Automatique' },
    viewDetails: { en: 'View Details', fr: 'Voir les Détails' },
    hideDetails: { en: 'Hide Details', fr: 'Masquer les Détails' },
    noIssues: { en: 'No issues detected', fr: 'Aucun problème détecté' },
    services: { en: 'Services', fr: 'Services' },
    database: { en: 'Database', fr: 'Base de données' },
    storage: { en: 'Storage', fr: 'Stockage' },
    latency: { en: 'Latency', fr: 'Latence' },
    up: { en: 'Up', fr: 'En ligne' },
    down: { en: 'Down', fr: 'Hors ligne' },
    error: { en: 'Error', fr: 'Erreur' },
    component: { en: 'Component', fr: 'Composant' },
    message: { en: 'Message', fr: 'Message' },
    time: { en: 'Time', fr: 'Heure' },
    acknowledge: { en: 'Acknowledge', fr: 'Reconnaître' },
    resolve: { en: 'Resolve', fr: 'Résoudre' },
    operation: { en: 'Operation', fr: 'Opération' },
    duration: { en: 'Duration', fr: 'Durée' },
    ms: { en: 'ms', fr: 'ms' },
    viewAll: { en: 'View All', fr: 'Voir Tout' },
    attemptRecovery: { en: 'Attempt Recovery', fr: 'Tenter une Récupération' },
    recovering: { en: 'Recovering...', fr: 'Récupération en cours...' },
    lastUpdated: { en: 'Last Updated', fr: 'Dernière Mise à Jour' }
  };

  // Fetch system health data
  const fetchHealthData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch health status
      const healthResponse = await ErrorMonitoring.getSystemHealth();
      if (healthResponse.success) {
        setHealthStatus(healthResponse.data);
        
        // Notify parent if there are critical errors
        if (onErrorsDetected && healthResponse.data.criticalErrorCount > 0) {
          onErrorsDetected(healthResponse.data.criticalErrorCount);
        }
      }
      
      // Fetch recent errors
      const errorsResponse = await ErrorMonitoring.getSystemErrors({
        pageSize: 5,
        status: 'new',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
      });
      
      if (errorsResponse.success) {
        setRecentErrors(errorsResponse.data.errors);
      }
      
      // Fetch slow operations
      const slowOps = await PerformanceMonitor.getSlowOperations(1000, 5);
      setSlowOperations(slowOps);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onErrorsDetected]);

  // Initial data fetch and auto refresh setup
  useEffect(() => {
    fetchHealthData();
    
    // Set up auto refresh
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchHealthData();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchHealthData, refreshInterval, autoRefresh]);

  // Handle error acknowledgment
  const handleAcknowledgeError = async (errorId: string) => {
    try {
      const response = await ErrorMonitoring.updateErrorStatus(
        errorId,
        'acknowledged',
        `Acknowledged by ${user?.email || 'admin user'}`
      );
      
      if (response.success) {
        // Refresh data to show updated status
        fetchHealthData();
      }
    } catch (error) {
      console.error('Error acknowledging error:', error);
    }
  };

  // Handle error resolution
  const handleResolveError = async (errorId: string) => {
    try {
      const response = await ErrorMonitoring.updateErrorStatus(
        errorId,
        'resolved',
        `Resolved manually by ${user?.email || 'admin user'}`
      );
      
      if (response.success) {
        // Refresh data to show updated status
        fetchHealthData();
      }
    } catch (error) {
      console.error('Error resolving error:', error);
    }
  };

  // Handle automatic recovery attempt
  const handleAttemptRecovery = async (errorId: string) => {
    try {
      const response = await ErrorMonitoring.attemptErrorRecovery(errorId);
      
      if (response.success) {
        // Refresh data to show updated status
        fetchHealthData();
      }
    } catch (error) {
      console.error('Error attempting recovery:', error);
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy' | 'up' | 'down' | 'degraded') => {
    let colorClass = '';
    
    switch (status) {
      case 'healthy':
      case 'up':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'degraded':
        colorClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'unhealthy':
      case 'down':
        colorClass = 'bg-red-100 text-red-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {t(text[status])}
      </span>
    );
  };

  // Render severity badge
  const renderSeverityBadge = (severity: ErrorSeverity) => {
    let colorClass = '';
    
    switch (severity) {
      case ErrorSeverity.INFO:
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case ErrorSeverity.WARNING:
        colorClass = 'bg-yellow-100 text-yellow-800';
        break;
      case ErrorSeverity.ERROR:
        colorClass = 'bg-orange-100 text-orange-800';
        break;
      case ErrorSeverity.CRITICAL:
        colorClass = 'bg-red-100 text-red-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {severity}
      </span>
    );
  };

  if (isLoading && !healthStatus) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">{t(text.loading)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
          {t(text.title)}
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHealthData}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg 
              className="h-4 w-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t(text.refresh)}
          </button>
          
          <div className="flex items-center">
            <input
              id="auto-refresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-refresh" className="ml-2 text-sm text-gray-700">
              {t(text.autoRefresh)}
            </label>
          </div>
        </div>
      </div>
      
      {healthStatus && (
        <>
          {/* Overview section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">{t(text.status)}</span>
                <div className="mt-1 flex items-center">
                  {renderStatusBadge(healthStatus.status)}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">{t(text.criticalErrors)}</span>
                <div className="mt-1 flex items-center">
                  <span className={`text-lg font-medium ${
                    healthStatus.criticalErrorCount > 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>{healthStatus.criticalErrorCount}</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">{t(text.warnings)}</span>
                <div className="mt-1 flex items-center">
                  <span className={`text-lg font-medium ${
                    healthStatus.warningCount > 0 ? 'text-yellow-600' : 'text-gray-900'
                  }`}>{healthStatus.warningCount}</span>
                </div>
              </div>
            </div>
            
            {/* Last updated timestamp */}
            <div className="mt-3 text-xs text-gray-500">
              {t(text.lastUpdated)}: {formatDateTime(new Date().toISOString())}
            </div>
          </div>
          
          {/* Services section */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t(text.services)}</h3>
            <div className="bg-white border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(text.services)}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(text.status)}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(text.latency)}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {healthStatus.services.map((service) => (
                    <tr key={service.name}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {t(text[service.name] || { en: service.name, fr: service.name })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderStatusBadge(service.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {service.latency ? `${service.latency.toFixed(0)} ${t(text.ms)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Errors section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {t(text.criticalErrors)} & {t(text.warnings)}
              </h3>
              <button
                onClick={() => setExpandedSection(expandedSection === 'errors' ? null : 'errors')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {expandedSection === 'errors' ? t(text.hideDetails) : t(text.viewDetails)}
              </button>
            </div>
            
            {expandedSection === 'errors' && (
              <div className="bg-white border rounded-md overflow-hidden">
                {recentErrors.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.severity)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.component)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.message)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.time)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.action)}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentErrors.map((error) => (
                        <tr key={error.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderSeverityBadge(error.severity)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {error.component || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {error.message}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {error.created_at ? formatDateTime(error.created_at) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => handleAttemptRecovery(error.id!)}
                                className="text-green-600 hover:text-green-900"
                              >
                                {t(text.attemptRecovery)}
                              </button>
                              <button
                                onClick={() => handleAcknowledgeError(error.id!)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {t(text.acknowledge)}
                              </button>
                              <button
                                onClick={() => handleResolveError(error.id!)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                {t(text.resolve)}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-sm text-gray-700 text-center">
                    {t(text.noIssues)}
                  </div>
                )}
              </div>
            )}
            {!expandedSection && recentErrors.length > 0 && (
              <div className="text-sm text-gray-500">
                {recentErrors.length} {recentErrors.length === 1 ? 'issue' : 'issues'} detected in the last 24 hours.
              </div>
            )}
          </div>
          
          {/* Performance section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {t(text.performanceIssues)}
              </h3>
              <button
                onClick={() => setExpandedSection(expandedSection === 'performance' ? null : 'performance')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {expandedSection === 'performance' ? t(text.hideDetails) : t(text.viewDetails)}
              </button>
            </div>
            
            {expandedSection === 'performance' && (
              <div className="bg-white border rounded-md overflow-hidden">
                {slowOperations.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.operation)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.component)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.duration)}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t(text.time)}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {slowOperations.map((op, index) => (
                        <tr key={op.id || index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {op.operationName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {op.component}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {op.duration.toFixed(0)} {t(text.ms)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(op.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-sm text-gray-700 text-center">
                    {t(text.noIssues)}
                  </div>
                )}
              </div>
            )}
            {!expandedSection && slowOperations.length > 0 && (
              <div className="text-sm text-gray-500">
                {slowOperations.length} {slowOperations.length === 1 ? 'slow operation' : 'slow operations'} detected.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SystemHealthMonitor; 