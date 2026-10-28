import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ScanFace,
  QrCode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  Camera
} from 'lucide-react';
import type { AttendanceRecord, ClassSession } from '../types';
import { api } from '../services/api';

interface AttendanceViewProps {
  sessions: ClassSession[];
  selectedSessionId: number;
  onSelectSession: (id: number) => void;
  attendanceRecords: AttendanceRecord[];
  onRefreshRecords: () => void;
  onNavigateTab?: (tab: string) => void;
}

type SortField = 'student_name' | 'student_code' | 'status' | 'confidence_score' | 'timestamp';
type SortOrder = 'asc' | 'desc';

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  attendanceRecords,
  onRefreshRecords,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [sortField, setSortField] = useState<SortField>('student_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & sort records
  const processedRecords = useMemo(() => {
    let list = attendanceRecords.filter((rec) => {
      const matchesSearch =
        rec.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.student_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [attendanceRecords, searchQuery, statusFilter, sortField, sortOrder]);

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;

  const handleStatusChange = async (record: AttendanceRecord, newStatus: 'present' | 'late' | 'absent') => {
    setUpdatingId(record.id);
    try {
      await api.updateAttendanceRecord(record.id, {
        status: newStatus,
        notes: `Updated by instructor to ${newStatus}`
      });
      onRefreshRecords();
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBatchVerifyAll = async () => {
    const studentIds = attendanceRecords.map((r) => r.student_id);
    if (studentIds.length === 0) return;
    try {
      await api.batchVerifyAttendance({
        session_id: selectedSessionId,
        student_ids: studentIds,
        status: 'present',
        verification_method: 'manual'
      });
      onRefreshRecords();
    } catch (err) {
      console.error('Batch verify error:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Student ID', 'Name', 'Status', 'Method', 'Confidence', 'Timestamp', 'Notes'];
    const rows = processedRecords.map((r) => [
      r.id,
      r.student_code,
      `"${r.student_name}"`,
      r.status,
      r.verification_method,
      `${Math.round(r.confidence_score * 100)}%`,
      r.timestamp,
      `"${r.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Session_${selectedSessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} color="var(--slate-400)" />;
    }
    return sortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary-600)" /> : <ArrowDown size={13} color="var(--primary-600)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Session Header & Filter Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Session Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Select Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(Number(e.target.value))}
              aria-label="Select Classroom Session"
              style={{
                display: 'block',
                marginTop: '4px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-300)',
                backgroundColor: 'var(--bg-surface)',
                fontWeight: 600,
                fontSize: '13.5px',
                color: 'var(--slate-800)',
                minWidth: '280px'
              }}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code} - {s.course_name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Stats Pill */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--emerald-50)',
              color: 'var(--emerald-700)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <CheckCircle2 size={14} /> Present: {presentCount}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--amber-50)',
              color: 'var(--amber-700)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <Clock size={14} /> Late: {lateCount}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--rose-50)',
              color: 'var(--rose-700)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <XCircle size={14} /> Absent: {absentCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('vision-scanner')}
              aria-label="Launch Classroom Vision Scanner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--emerald-300)',
                backgroundColor: 'var(--emerald-50)',
                color: 'var(--emerald-700)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Camera size={15} /> Open Vision Scanner
            </button>
          )}

          <button
            onClick={handleBatchVerifyAll}
            aria-label="Batch mark all students present"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-300)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={15} /> Batch Verify All Present
          </button>

          <button
            onClick={handleExportCSV}
            aria-label="Export attendance to CSV"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Roster Controls: Search, Date Filter, Status Filters */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--slate-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--slate-50)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-200)',
            width: '280px'
          }}>
            <Search size={16} color="var(--slate-400)" />
            <input
              type="text"
              aria-label="Search students by name or code"
              placeholder="Search student or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                width: '100%',
                color: 'var(--slate-800)'
              }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'present', 'late', 'absent'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                aria-label={`Filter by status ${st}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: statusFilter === st ? 'var(--primary-50)' : 'transparent',
                  color: statusFilter === st ? 'var(--primary-700)' : 'var(--slate-600)',
                  border: statusFilter === st ? '1px solid var(--primary-200)' : '1px solid transparent'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table with interactive column sorting */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th
                  onClick={() => handleSort('student_name')}
                  style={{ padding: '12px 20px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Student {renderSortIcon('student_name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('student_code')}
                  style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Student ID {renderSortIcon('student_code')}
                  </div>
                </th>
                <th style={{ padding: '12px 16px' }}>Verification Method</th>
                <th
                  onClick={() => handleSort('confidence_score')}
                  style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Confidence {renderSortIcon('confidence_score')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('timestamp')}
                  style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Verified Time {renderSortIcon('timestamp')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Status {renderSortIcon('status')}
                  </div>
                </th>
                <th style={{ padding: '12px 20px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {processedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate-400)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Inbox size={36} color="var(--slate-400)" />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-700)' }}>
                        No Attendance Records Found
                      </div>
                      <p style={{ fontSize: '12px' }}>
                        No records match the current search or status filter. Try clearing filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        style={{
                          marginTop: '6px',
                          padding: '5px 12px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedRecords.map((record) => {
                  const isPresent = record.status === 'present';
                  const isLate = record.status === 'late';
                  return (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: '1px solid var(--slate-100)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-50)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Student Info */}
                      <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={record.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.student_code}`}
                          alt={record.student_name}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--slate-200)'
                          }}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {record.student_name}
                        </span>
                      </td>

                      {/* Student ID */}
                      <td style={{ padding: '14px 16px', color: 'var(--slate-600)', fontFamily: 'monospace', fontWeight: 600 }}>
                        {record.student_code}
                      </td>

                      {/* Method */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: record.verification_method === 'biometric_face' ? 'var(--primary-50)' : 'var(--slate-100)',
                          color: record.verification_method === 'biometric_face' ? 'var(--primary-700)' : 'var(--slate-700)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {record.verification_method === 'biometric_face' ? <ScanFace size={13} /> : <QrCode size={13} />}
                          {record.verification_method === 'biometric_face' ? 'Biometric Face' : record.verification_method}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--slate-200)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.round(record.confidence_score * 100)}%`,
                              height: '100%',
                              backgroundColor: record.confidence_score > 0.85 ? 'var(--emerald-500)' : 'var(--amber-500)'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                            {Math.round(record.confidence_score * 100)}%
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '14px 16px', color: 'var(--slate-500)', fontSize: '12px' }}>
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Status Toggle Selector */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={record.status}
                          disabled={updatingId === record.id}
                          onChange={(e) => handleStatusChange(record, e.target.value as any)}
                          aria-label={`Update status for ${record.student_name}`}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: isPresent ? 'var(--emerald-50)' : isLate ? 'var(--amber-50)' : 'var(--rose-50)',
                            color: isPresent ? 'var(--emerald-700)' : isLate ? 'var(--amber-700)' : 'var(--rose-700)',
                            border: `1px solid ${isPresent ? 'rgba(16,185,129,0.3)' : isLate ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '14px 20px', color: 'var(--slate-500)', fontSize: '12px' }}>
                        {record.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
