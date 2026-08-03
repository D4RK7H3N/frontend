import { forwardRef, useState } from 'react'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'

export const formatCurrency = (amount) => {
  return `₱${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const getProcessorName = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    return user?.username || 'Cashier'
  } catch {
    return 'Cashier'
  }
}

const Receipt = forwardRef(({ data, type = 'thermal' }, ref) => {
  const { config, schoolLogo } = useSchoolConfig()
  const [imgError, setImgError] = useState(false)
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const schoolName = data?.schoolName || config?.school_name?.toUpperCase() || 'MANAGEMENT SYSTEM'
  const schoolAddress = data?.schoolAddress || (config ? [config.address_line1, config.city, config.province].filter(Boolean).join(', ') : 'Philippines')
  const schoolContact = data?.schoolContact || config?.phone_number || 'N/A'

  const isFullyPaid = data?.balance !== undefined ? parseFloat(data.balance) <= 0 : false
  const previousBalance = data?.previousBalance !== undefined
    ? parseFloat(data.previousBalance)
    : (data?.total || 0)

  if (type === 'official') {
    return (
      <div ref={ref} className="official-receipt print-longbond bg-white p-8 max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="w-20 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center overflow-hidden">
            {!imgError && schoolLogo ? (
              <img src={schoolLogo} alt="" className="w-full h-full object-contain p-1" onError={() => setImgError(true)} />
            ) : (
              <span className="text-xs text-center text-gray-500">School<br />Seal</span>
            )}
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg font-bold">{schoolName}</h1>
            <p className="text-xs">{schoolAddress}</p>
            <p className="text-xs">{schoolContact}</p>
          </div>
          <div className="w-20 h-20"></div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold underline">OFFICIAL RECEIPT</h2>
          <div className="flex justify-between mt-2 text-sm">
            <span>OR No.: <strong>{data?.receiptNo || data?.receipt_number || `OR-${data?.id}` || 'N/A'}</strong></span>
            <span>Date: <strong>{formattedDate}</strong></span>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p><strong>Received from:</strong> {data?.studentName || data?.student_name || data?.customer_name || 'N/A'}</p>
          <p><strong>LRN:</strong> {data?.lrn || data?.student_lrn || 'N/A'}</p>
          {data?.gradeSection && <p><strong>Grade/Section:</strong> {data.gradeSection}</p>}
        </div>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-2">{item.product_name || item.name || item.description || 'Item'}</td>
                <td className="py-2 text-right">{formatCurrency(item.amount || item.price)}</td>
              </tr>
            ))}
            <tr className="font-bold border-t-2 border-black">
              <td className="py-3 text-right">TOTAL</td>
              <td className="py-3 text-right">{formatCurrency(data?.total || 0)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mb-6">
          {data?.previousBalance !== undefined && (
            <p><strong>Previous Balance:</strong> {formatCurrency(previousBalance)}</p>
          )}
          {data?.amount_paid !== undefined && (
            <p><strong>Amount Paid to Date:</strong> {formatCurrency(data.amount_paid)}</p>
          )}
          {data?.balance !== undefined && (
            <p className={isFullyPaid ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              <strong>{isFullyPaid ? 'FULLY PAID' : 'Remaining Balance:'}</strong>
              {!isFullyPaid && ` ${formatCurrency(data.balance)}`}
            </p>
          )}
          <p><strong>Amount in Words:</strong> {data?.amountInWords || 'Zero Pesos Only'}</p>
          <p><strong>Payment Method:</strong> {data?.paymentMethod || data?.payment_method || 'Cash'}</p>
          {data?.gcash_reference && <p><strong>GCash Ref:</strong> {data.gcash_reference}</p>}
          {data?.check_number && <p><strong>Check #:</strong> {data.check_number}</p>}
          {data?.tendered && (
            <>
              <p><strong>Amount Tendered:</strong> {formatCurrency(data.tendered)}</p>
              <p><strong>Change:</strong> {formatCurrency(data.change)}</p>
            </>
          )}
        </div>

        <div className="flex justify-between mt-12 pt-4">
          <div className="text-center w-40">
            <div className="border-b border-black h-8"></div>
            <p className="text-xs mt-1">Cashier Signature</p>
          </div>
          <div className="text-center w-40">
            <div className="border-b border-black h-8"></div>
            <p className="text-xs mt-1">Received By</p>
          </div>
          <div className="text-center w-40">
            <div className="border-b border-black h-8"></div>
            <p className="text-xs mt-1">Authorized Signature</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This official receipt is not valid for income tax deduction without BIR stamp.</p>
          <p>Please present this receipt when claiming documents or for any transaction inquiries.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="receipt-paper print-receipt" style={{ width: '80mm', maxWidth: '100%', margin: '0 auto', background: '#fff', color: '#000', fontFamily: 'monospace', fontSize: '12px', padding: '8px' }}>
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
        {!imgError && schoolLogo ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <img src={schoolLogo} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={() => setImgError(true)} />
          </div>
        ) : null}
        <strong style={{ fontSize: '12px' }}>{schoolName}</strong>
        <p style={{ fontSize: '9px', margin: '1px 0' }}>{schoolAddress}</p>
        <p style={{ fontSize: '9px', margin: '1px 0' }}>{schoolContact}</p>
      </div>

      <div style={{ textAlign: 'center', padding: '3px 0', borderBottom: '1px dashed #000', marginBottom: '4px' }}>
        <strong style={{ fontSize: '11px' }}>OFFICIAL RECEIPT</strong>
      </div>

      <div style={{ fontSize: '10px', padding: '2px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Receipt No.:</span>
          <span style={{ fontWeight: 600 }}>{data?.receiptNo || data?.receipt_number || `OR-${data?.id}` || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span>{formattedTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cashier:</span>
          <span>{getProcessorName()}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
          <span>Student:</span>
          <span>{data?.studentName || data?.student_name || data?.customer_name || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
          <span>LRN:</span>
          <span>{data?.lrn || data?.student_lrn || 'N/A'}</span>
        </div>
        {data?.gradeSection && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>Section:</span>
            <span>{data.gradeSection}</span>
          </div>
        )}
      </div>

      <div style={{ fontSize: '10px' }}>
        {data?.items?.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{item.product_name || item.name || item.description || 'Item'}</span>
            <span style={{ marginLeft: '8px' }}>{formatCurrency(item.amount || item.price)}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3px 0', marginTop: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(data?.total || 0)}</span>
        </div>
      </div>

      <div style={{ fontSize: '10px', padding: '2px 0' }}>
        {data?.balance !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: isFullyPaid ? '#16a34a' : '#dc2626' }}>
            <span>{isFullyPaid ? 'STATUS:' : 'Balance:'}</span>
            <span>{isFullyPaid ? 'FULLY PAID ✓' : formatCurrency(data.balance)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Method:</span>
          <span style={{ textTransform: 'capitalize' }}>{data?.paymentMethod || data?.payment_method || 'Cash'}</span>
        </div>
        {data?.gcash_reference && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GCash Ref:</span>
            <span>{data.gcash_reference}</span>
          </div>
        )}
        {data?.check_number && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Check #:</span>
            <span>{data.check_number}</span>
          </div>
        )}
        {data?.tendered && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tendered:</span>
              <span>{formatCurrency(data.tendered)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Change:</span>
              <span>{formatCurrency(data.change)}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
        <p style={{ fontSize: '9px' }}>Thank you for your payment!</p>
        <p style={{ fontSize: '8px' }}>This is an Official Receipt. Please keep for your records.</p>
      </div>
    </div>
  )
})

Receipt.displayName = 'Receipt'

export default Receipt