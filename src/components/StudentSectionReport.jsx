import { forwardRef, useState } from 'react'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'

const StudentSectionReport = forwardRef(({ students, filters, schoolName }, ref) => {
  const { config } = useSchoolConfig()
  const [imgError, setImgError] = useState(false)
  const name = schoolName || config?.school_name || 'School Name'

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getSchoolYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    return now.getMonth() >= 5 ? `${year} - ${year + 1}` : `${year - 1} - ${year}`
  }

  const getGradeYear = (student) => {
    const lt = student.level_type
    if (lt === 'SHS') return student.shs_grade ? `Grade ${student.shs_grade}` : student.grade || 'N/A'
    if (lt === 'BUN') {
      const ym = { '1': '1st Year', '2': '2nd Year' }
      return student.college_year ? ym[student.college_year] || `${student.college_year} Year` : student.year_level || student.grade || 'N/A'
    }
    return student.year_level || student.grade || 'N/A'
  }

  return (
    <div ref={ref} className="print-report" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: 1.4, color: '#000', background: '#fff', padding: '20px', maxWidth: '210mm' }}>
      <div className="flex items-center justify-center gap-4 mb-8 pb-4 border-b-[3px] border-gray-700">
        <div className="w-14 h-14 flex-shrink-0">
          {!imgError && config?.logo ? (
            <img src={config.logo} alt="School Logo" className="w-full h-full object-contain"
              onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xl font-bold rounded">
              {(config?.school_name || 'S')[0]}
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold uppercase mb-1" style={{ color: '#000' }}>{name}</p>
          <p className="text-base font-bold my-2" style={{ color: '#000' }}>CLASS SECTION LIST</p>
          <p className="text-xs" style={{ color: '#666' }}>School Year: {getSchoolYear()}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-6 border-l-4 border-blue-500">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold">Section:</span> {filters?.section || 'All Sections'}</div>
          <div><span className="font-bold">Track/Strand:</span> {filters?.strand || 'All Tracks/Strands'}</div>
          <div><span className="font-bold">Grade Level:</span> {filters?.gradeLevel || 'All Grade Levels'}</div>
          <div><span className="font-bold">Total Students:</span> {students.length}</div>
        </div>
      </div>

      <table className="w-full border-collapse mb-8" style={{ fontSize: '11px' }}>
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-300 px-2 py-2.5 text-center font-bold w-[5%]">No.</th>
            <th className="border border-gray-300 px-2 py-2.5 text-left font-bold w-[15%]">LRN</th>
            <th className="border border-gray-300 px-2 py-2.5 text-left font-bold w-[35%]">Full Name</th>
            <th className="border border-gray-300 px-2 py-2.5 text-left font-bold w-[30%]">Grade/Year</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-2.5 text-center" style={{ color: '#000' }}>{i + 1}</td>
              <td className="border border-gray-300 px-2 py-2.5" style={{ color: '#000' }}>{s.lrn || s.student_id || 'N/A'}</td>
              <td className="border border-gray-300 px-2 py-2.5 font-medium" style={{ color: '#000' }}>
                {s.last_name?.toUpperCase()}, {s.first_name} {s.middle_name ? `${s.middle_name.charAt(0)}.` : ''}
              </td>
              <td className="border border-gray-300 px-2 py-2.5" style={{ color: '#000' }}>{getGradeYear(s)}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="border border-gray-300 py-10 text-center text-gray-400 italic">No students found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-10 pt-5 border-t border-gray-300">
        <div className="flex justify-between mt-16 gap-10">
          <div className="flex-1 text-center">
            <div className="border-t-2 border-gray-700 pt-2 text-xs font-bold">Adviser</div>
            <p className="text-[10px] text-gray-500 mt-1">Name and Signature</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t-2 border-gray-700 pt-2 text-xs font-bold">Department Head</div>
            <p className="text-[10px] text-gray-500 mt-1">Name and Signature</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t-2 border-gray-700 pt-2 text-xs font-bold">Principal/Director</div>
            <p className="text-[10px] text-gray-500 mt-1">Name and Signature</p>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-8">Document generated on {formatDate()}</p>
      </div>

      <style>{`
        @media print {
          .print-report { padding: 0 !important; margin: 0 !important; }
          .print-report * { color: #000 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
})

StudentSectionReport.displayName = 'StudentSectionReport'
export default StudentSectionReport
