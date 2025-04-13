import React, { useState, useEffect } from 'react';
import { analyticsService, AnalyticsEventType } from '../services/analytics-service';
import { errorHandlerService, TransactionErrorType } from '../services/error-handler-service';

interface AdminDashboardViewProps {
  onBackToHome: () => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'errors' | 'users'>('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      try {
        // Get analytics summary
        const analyticsSummary = analyticsService.getAnalyticsSummary();
        setAnalyticsData(analyticsSummary);

        // Get error stats
        const errorData = errorHandlerService.getErrorStats();
        setErrorStats(errorData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const clearAnalyticsData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analyticsService.clearAnalyticsData();
      setAnalyticsData(analyticsService.getAnalyticsSummary());
    }
  };

  const clearErrorHistory = () => {
    if (window.confirm('Are you sure you want to clear all error history? This cannot be undone.')) {
      errorHandlerService.clearErrorHistory();
      setErrorStats(errorHandlerService.getErrorStats());
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Back to Home
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Convert object to sorted array for display
  const objectToSortedArray = (obj: Record<string, number>) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Back to Home
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === 'overview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'analytics'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'errors'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('errors')}
        >
          Errors
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'users'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">Game Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Games Created</p>
                <p className="text-2xl font-bold">{analyticsData?.gamesCreated || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Games Completed</p>
                <p className="text-2xl font-bold">{analyticsData?.gamesCompleted || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Avg. Game Duration</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.averageGameDuration
                    ? `${Math.round(analyticsData.averageGameDuration / 1000)}s`
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Unique Users</p>
                <p className="text-2xl font-bold">{analyticsData?.uniqueUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">Error Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Errors</p>
                <p className="text-2xl font-bold">{errorStats?.totalErrors || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Unresolved</p>
                <p className="text-2xl font-bold">{errorStats?.unresolvedErrors || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Most Common</p>
                <p className="text-xl font-bold">
                  {errorStats && Object.keys(errorStats.errorsByType).length > 0
                    ? Object.entries(errorStats.errorsByType)
                        .sort((a, b) => b[1] - a[1])[0][0]
                        .replace(/_/g, ' ')
                        .toLowerCase()
                    : 'None'
                  }
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Last 24 Hours</p>
                <p className="text-2xl font-bold">0</p> {/* Placeholder - would need to implement */}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-md md:col-span-2">
            <h3 className="text-xl font-bold mb-4">System Health</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg border border-green-700">
                <p className="text-gray-400 text-sm">Server Status</p>
                <div className="flex items-center mt-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-lg font-semibold text-green-400">Online</p>
                </div>
              </div>
              <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg border border-green-700">
                <p className="text-gray-400 text-sm">Blockchain Connection</p>
                <div className="flex items-center mt-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-lg font-semibold text-green-400">Connected</p>
                </div>
              </div>
              <div className="bg-green-900 bg-opacity-30 p-4 rounded-lg border border-green-700">
                <p className="text-gray-400 text-sm">API Latency</p>
                <p className="text-lg font-semibold text-green-400">120ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Event Analytics</h3>
              <button
                onClick={clearAnalyticsData}
                className="px-3 py-1 bg-red-800 text-red-200 rounded text-sm hover:bg-red-700"
              >
                Clear Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-gray-300">Events by Type</h4>
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="text-left py-2 px-4">Event Type</th>
                        <th className="text-right py-2 px-4">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData && analyticsData.eventsByType &&
                        objectToSortedArray(analyticsData.eventsByType).map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-750' : 'bg-gray-700'}>
                            <td className="py-2 px-4">
                              {item.key.replace(/_/g, ' ').toLowerCase()}
                            </td>
                            <td className="text-right py-2 px-4">{item.value}</td>
                          </tr>
                        ))
                      }
                      {(!analyticsData || !analyticsData.eventsByType ||
                        Object.keys(analyticsData.eventsByType).length === 0) && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-gray-500">
                            No analytics data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-300">Top Pages</h4>
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="text-left py-2 px-4">Page</th>
                        <th className="text-right py-2 px-4">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData && analyticsData.topPages &&
                        objectToSortedArray(analyticsData.topPages).map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-750' : 'bg-gray-700'}>
                            <td className="py-2 px-4">{item.key}</td>
                            <td className="text-right py-2 px-4">{item.value}</td>
                          </tr>
                        ))
                      }
                      {(!analyticsData || !analyticsData.topPages ||
                        Object.keys(analyticsData.topPages).length === 0) && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-gray-500">
                            No page view data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Error Tracking</h3>
              <button
                onClick={clearErrorHistory}
                className="px-3 py-1 bg-red-800 text-red-200 rounded text-sm hover:bg-red-700"
              >
                Clear Errors
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2 text-gray-300">Errors by Type</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {errorStats && errorStats.errorsByType && Object.entries(errorStats.errorsByType).map(([type, count], index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">{type.replace(/_/g, ' ').toLowerCase()}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  ))}

                  {(!errorStats || !errorStats.errorsByType ||
                    Object.keys(errorStats.errorsByType).length === 0) && (
                    <div className="col-span-full py-4 text-center text-gray-500">
                      No error data available
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-300">Recent Errors</h4>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-center text-gray-500 py-4">
                    Error details would be displayed here in a production environment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">User Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{analyticsData?.uniqueUsers || 0}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Active Today</p>
                <p className="text-2xl font-bold">0</p> {/* Placeholder - would need to implement */}
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Average Games Per User</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.uniqueUsers && analyticsData?.gamesCompleted
                    ? (analyticsData.gamesCompleted / analyticsData.uniqueUsers).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-gray-300">Top Users</h4>
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <p className="text-center text-gray-500 py-4">
                  User rankings would be displayed here in a production environment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
