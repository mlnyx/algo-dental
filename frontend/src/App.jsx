import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, Users, Clock, TrendingUp, AlertCircle, CheckCircle, Pause } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE = import.meta.env.VITE_API_URL || ''

function App() {
  const [chairs, setChairs] = useState([])
  const [stats, setStats] = useState({})
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    treatment_type: '정기검진',
    priority: 'normal'
  })

  const fetchData = async () => {
    try {
      const [chairsRes, statsRes, queueRes] = await Promise.all([
        axios.get(`${API_BASE}/api/chairs`),
        axios.get(`${API_BASE}/api/stats`),
        axios.get(`${API_BASE}/api/queue`)
      ])
      
      setChairs(chairsRes.data)
      setStats(statsRes.data)
      setQueue(queueRes.data)
      setLoading(false)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleChairClick = async (chairId, currentStatus, currentPatient) => {
    let newStatus = 'idle'
    let patient_name = null
    let patient_phone = null

    if (currentStatus === 'idle') {
      if (queue.length === 0) {
        alert('대기 중인 환자가 없습니다.')
        return
      }
      newStatus = 'active'
      patient_name = queue[0].name
      patient_phone = queue[0].phone
    } else if (currentStatus === 'active') {
      newStatus = 'idle'
    }

    try {
      await axios.post(`${API_BASE}/api/chairs/${chairId}`, {
        status: newStatus,
        patient_name: patient_name,
        patient_phone: patient_phone
      })
      fetchData()
    } catch (error) {
      console.error('체어 업데이트 실패:', error)
    }
  }

  const handleAddPatient = async (e) => {
    e.preventDefault()
    
    if (!newPatient.name || !newPatient.phone) {
      alert('환자명과 전화번호를 입력해주세요.')
      return
    }

    try {
      await axios.post(`${API_BASE}/api/queue`, newPatient)
      setNewPatient({
        name: '',
        phone: '',
        treatment_type: '정기검진',
        priority: 'normal'
      })
      setShowAddPatient(false)
      fetchData()
    } catch (error) {
      console.error('환자 추가 실패:', error)
      alert('환자 추가에 실패했습니다.')
    }
  }

  const handleDeletePatient = async (patientId) => {
    if (!confirm('이 환자를 대기열에서 제거하시겠습니까?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/api/queue/${patientId}`)
      fetchData()
    } catch (error) {
      console.error('환자 삭제 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-palantir-blue text-2xl animate-pulse">ALGO 시스템 로딩중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-palantir-dark palantir-grid p-6">
      {/* 헤더 */}
      <header className="mb-8 border-b border-palantir-grid pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-palantir-blue mb-2 tracking-tight">
              ALGO / OPERATING SYSTEM
            </h1>
            <p className="text-gray-500 text-sm">Dental Management Platform v1.0</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 text-sm">
              ● SYSTEM ONLINE
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-200">
                {new Date().toLocaleTimeString('ko-KR')}
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="총 진료 수"
          value={stats.totalTreatments}
          unit="건"
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="진료중 체어"
          value={stats.activeChairs}
          unit="/ 5"
          color="emerald"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="평균 대기시간"
          value={stats.avgWaitTime}
          unit="분"
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="장비 가동률"
          value={stats.equipmentUsage}
          unit="%"
          color="purple"
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 체어 상태 */}
        <div className="col-span-2">
          <div className="data-card mb-6">
            <h2 className="text-xl font-bold text-palantir-blue mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              CHAIR STATUS MONITOR
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {chairs.map((chair) => (
                <ChairCard
                  key={chair.id}
                  chair={chair}
                  onClick={() => handleChairClick(chair.id, chair.status, chair.patient)}
                />
              ))}
            </div>
          </div>

          {/* 차트 */}
          <div className="data-card">
            <h2 className="text-xl font-bold text-palantir-blue mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              OPERATIONAL EFFICIENCY
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">시간대별 진료 건수</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="hour" stroke="#64748B" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#64748B" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0A0F1E',
                        border: '1px solid #1E293B',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="treatments" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">운영 효율 추이</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="hour" stroke="#64748B" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#64748B" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0A0F1E',
                        border: '1px solid #1E293B',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 대기열 */}
        <div className="col-span-1">
          <div className="data-card sticky top-6">
            <h2 className="text-xl font-bold text-palantir-blue mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                WAITING QUEUE
              </span>
              <span className="text-sm bg-palantir-blue/20 px-2 py-1 rounded">
                {queue.length}명
              </span>
            </h2>

            {/* 환자 추가 버튼 */}
            <button
              onClick={() => setShowAddPatient(!showAddPatient)}
              className="w-full mb-4 py-2 bg-palantir-blue/10 hover:bg-palantir-blue/20 text-palantir-blue rounded text-sm font-semibold transition-all border border-palantir-blue/30"
            >
              + 환자 추가
            </button>

            {/* 환자 추가 폼 */}
            {showAddPatient && (
              <form onSubmit={handleAddPatient} className="mb-4 p-4 bg-palantir-darker border border-palantir-blue/30 rounded-lg">
                <input
                  type="text"
                  placeholder="환자명"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  className="w-full mb-2 px-3 py-2 bg-palantir-dark border border-palantir-grid rounded text-white text-sm focus:border-palantir-blue focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="전화번호 (010-1234-5678)"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  className="w-full mb-2 px-3 py-2 bg-palantir-dark border border-palantir-grid rounded text-white text-sm focus:border-palantir-blue focus:outline-none"
                  required
                />
                <select
                  value={newPatient.treatment_type}
                  onChange={(e) => setNewPatient({...newPatient, treatment_type: e.target.value})}
                  className="w-full mb-2 px-3 py-2 bg-palantir-dark border border-palantir-grid rounded text-white text-sm focus:border-palantir-blue focus:outline-none"
                >
                  <option>정기검진</option>
                  <option>스케일링</option>
                  <option>충치치료</option>
                  <option>임플란트</option>
                  <option>긴급치료</option>
                </select>
                <select
                  value={newPatient.priority}
                  onChange={(e) => setNewPatient({...newPatient, priority: e.target.value})}
                  className="w-full mb-3 px-3 py-2 bg-palantir-dark border border-palantir-grid rounded text-white text-sm focus:border-palantir-blue focus:outline-none"
                >
                  <option value="normal">일반</option>
                  <option value="high">긴급</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-palantir-blue text-white rounded text-sm font-semibold hover:bg-palantir-blue/80 transition-all"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPatient(false)}
                    className="flex-1 py-2 bg-gray-600 text-white rounded text-sm font-semibold hover:bg-gray-500 transition-all"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {queue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>대기 환자 없음</p>
                </div>
              ) : (
                queue.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-palantir-dark border border-palantir-grid rounded-lg p-4 hover:border-palantir-blue/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{patient.name}</h3>
                        <p className="text-xs text-gray-500">{patient.type}</p>
                        <p className="text-xs text-gray-600 mt-1">{patient.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {patient.priority === 'high' && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded">
                            긴급
                          </span>
                        )}
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded"
                        >
                          제거
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {patient.arrivalTime} 도착
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 통계 카드 컴포넌트
function StatCard({ icon, title, value, unit, color }) {
  const colorClasses = {
    blue: 'border-palantir-blue/50 text-palantir-blue',
    emerald: 'border-emerald-500/50 text-emerald-400',
    amber: 'border-amber-500/50 text-amber-400',
    purple: 'border-purple-500/50 text-purple-400'
  }

  return (
    <div className={`data-card border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="ml-1 text-gray-500 text-sm">{unit}</span>
      </div>
    </div>
  )
}

// 체어 카드 컴포넌트
function ChairCard({ chair, onClick }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          label: '진료중',
          icon: <CheckCircle className="w-5 h-5" />,
          className: 'status-active',
          textColor: 'text-emerald-400'
        }
      case 'maintenance':
        return {
          label: '점검중',
          icon: <AlertCircle className="w-5 h-5" />,
          className: 'status-maintenance',
          textColor: 'text-amber-400'
        }
      default:
        return {
          label: '대기중',
          icon: <Pause className="w-5 h-5" />,
          className: 'status-idle',
          textColor: 'text-slate-400'
        }
    }
  }

  const statusConfig = getStatusConfig(chair.status)

  return (
    <div
      onClick={onClick}
      className="bg-palantir-dark border border-palantir-grid rounded-lg p-5 cursor-pointer hover:border-palantir-blue/50 transition-all hover:palantir-glow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">CHAIR #{chair.id}</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${statusConfig.className}`}>
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">환자명:</span>
          <span className={statusConfig.textColor}>
            {chair.patient || '-'}
          </span>
        </div>
        {chair.patientPhone && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">전화번호:</span>
            <span className="text-gray-500">{chair.patientPhone}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">진료시간:</span>
          <span className={statusConfig.textColor}>
            {chair.waitTime > 0 ? `${chair.waitTime}분` : '-'}
          </span>
        </div>
        {chair.lastUpdate && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">업데이트:</span>
            <span className="text-gray-500">{chair.lastUpdate}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-palantir-grid">
        <button className="w-full py-2 bg-palantir-blue/10 hover:bg-palantir-blue/20 text-palantir-blue rounded text-sm font-semibold transition-all">
          {chair.status === 'idle' ? '진료 시작' : '진료 종료'}
        </button>
      </div>
    </div>
  )
}

export default App
