import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AlertCircle, Check, MailPlus, RefreshCw, Shield, UserRoundX, UserRoundCheck, Trash2, X } from 'lucide-react'

const INITIAL_FORM = { fullName: '', email: '', role: 'counselor' }
const ACTION_COPY = {
  resend: 'resend the invitation email to',
  revoke: 'revoke the invitation for',
  deactivate: 'deactivate the staff account for',
  reactivate: 'reactivate the staff account for',
  delete: 'permanently delete the counselor account for',
}
const ACTION_DETAILS = {
  resend: 'A new invitation email will be sent.',
  revoke: 'The invitation will be cancelled and an unconfirmed account will be removed.',
  deactivate: 'They will be blocked from signing in.',
  reactivate: 'Their sign-in access will be restored.',
  delete: 'Their account and staff profile will be removed. Deletion is blocked if they have linked wellness records, so those records are preserved.',
}

async function getFunctionError(error, data, functionName) {
  if (data?.error) return data.error
  const message = error?.message || ''
  if (error?.name === 'FunctionsFetchError' || /failed to send a request/i.test(message)) {
    return `Could not contact the "${functionName}" Edge Function. Confirm it is deployed and that SITE_URL or ALLOWED_ORIGINS includes ${window.location.origin}. Check the browser network panel for CORS or connectivity errors.`
  }
  try {
    const body = await error?.context?.json()
    if (body?.error) return body.error
  } catch {
    // Use the standard Functions error message if there is no JSON body.
  }
  return error?.message || 'The request could not be completed.'
}

function StatusBadge({ status }) {
  const classes = {
    active: 'bg-[#EAF2E6] text-[#2D5A29]',
    invited: 'bg-[#FFF3C4] text-[#755b00]',
    disabled: 'bg-red-50 text-red-700',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${classes[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

export default function ManageStaff() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [acting, setActing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const cancelConfirmationRef = useRef(null)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, created_at')
      .in('role', ['counselor', 'admin'])
      .order('full_name', { ascending: true })

    if (queryError) {
      console.error('[ManageStaff] Could not load staff:', queryError)
      setStaff([])
      setError(`Staff could not be loaded: ${queryError.message}`)
    } else {
      setStaff(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadStaff() }, [loadStaff])

  useEffect(() => {
    if (!confirmation) return undefined
    cancelConfirmationRef.current?.focus()
    const handleEscape = event => {
      if (event.key === 'Escape') setConfirmation(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [confirmation])

  const sendInvite = async () => {
    if (submitting) return
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const { data, error: functionError } = await supabase.functions.invoke('invite-staff', {
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
        },
      })
      if (functionError) {
        throw new Error(await getFunctionError(functionError, data, 'invite-staff'))
      }
      if (data?.error) throw new Error(data.error)
      setForm(INITIAL_FORM)
      setNotice('Invitation sent.')
      await loadStaff()
    } catch (inviteError) {
      console.error('[ManageStaff] Invitation failed:', inviteError)
      setError(inviteError?.message || 'The invitation could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestInvite = (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setConfirmation({
      title: 'Send staff invitation?',
      message: `Are you sure you want to invite ${form.fullName.trim()} (${form.email.trim()}) as ${form.role === 'admin' ? 'an admin' : 'a counselor'}? An invitation email will be sent.`,
      confirmLabel: 'Send invitation',
      onConfirm: sendInvite,
    })
  }

  const runStaffAction = async (member, action) => {
    if (acting) return
    setError('')
    setNotice('')
    setActing(`${member.id}:${action}`)
    try {
      const { data, error: functionError } = await supabase.functions.invoke('set-staff-status', {
        body: { targetId: member.id, action },
      })
      if (functionError) throw new Error(await getFunctionError(functionError, data, 'set-staff-status'))
      if (data?.error) throw new Error(data.error)
      setNotice(action === 'resend'
        ? 'Invitation resent.'
        : action === 'delete'
          ? 'Counselor account deleted.'
          : 'Staff account updated.')
      await loadStaff()
    } catch (actionError) {
      console.error('[ManageStaff] Staff action failed:', actionError)
      setError(actionError?.message || 'The staff account could not be updated.')
    } finally {
      setActing(null)
    }
  }

  const requestStaffAction = (member, action) => {
    const name = member.full_name || member.email || 'this staff member'
    setError('')
    setNotice('')
    setConfirmation({
      title: 'Confirm staff action',
      message: `Are you sure you want to ${ACTION_COPY[action]} ${name}? ${ACTION_DETAILS[action]}`,
      confirmLabel: action === 'resend' ? 'Resend invitation' : action === 'delete' ? 'Delete account' : action[0].toUpperCase() + action.slice(1),
      destructive: action === 'revoke' || action === 'deactivate' || action === 'delete',
      onConfirm: () => runStaffAction(member, action),
    })
  }

  const confirmAction = () => {
    const action = confirmation?.onConfirm
    setConfirmation(null)
    action?.()
  }

  return (
    <div className="admin-page min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 h-[34rem] w-[34rem] rounded-full bg-[#F6C945]/5 blur-[100px] pointer-events-none" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#8C6218]">Administration</p>
            <h1 className="font-jakarta text-3xl font-extrabold text-[#3a2b25]">Manage <span className="font-playfair italic text-[#6B5A10]">Staff</span></h1>
            <p className="mt-2 text-sm text-[#3a2b25]/60">Invite counselors and manage staff account access.</p>
          </div>
          <button type="button" onClick={loadStaff} disabled={loading} aria-label="Refresh staff list" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#5D4037] shadow-sm disabled:opacity-50">
            {loading ? <LoadingIndicator size={12} label="Refreshing staff list" /> : <RefreshCw size={15} />} Refresh
          </button>
        </header>

        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        {notice && <div role="status" aria-live="polite" className="mb-5 flex items-center gap-2 rounded-xl bg-[#EAF2E6] px-4 py-3 text-sm font-medium text-[#2D5A29]"><Check size={17} />{notice}</div>}

        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm sm:p-7" aria-labelledby="invite-heading">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6C945]/20 text-[#755b00]"><MailPlus size={18} /></div>
            <div>
              <h2 id="invite-heading" className="font-jakarta text-lg font-extrabold text-[#3a2b25]">Invite staff</h2>
              <p className="text-xs text-[#3a2b25]/55">The invitation link will be emailed to the staff member.</p>
            </div>
          </div>

          <form onSubmit={requestInvite} className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
            <div>
              <label htmlFor="staff-name" className="mb-1.5 block text-xs font-bold text-[#755b00]">Full name</label>
              <input id="staff-name" type="text" autoComplete="name" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} minLength={2} maxLength={150} required className="w-full rounded-xl bg-[#FCF8F4] px-3.5 py-3 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]" />
            </div>
            <div>
              <label htmlFor="staff-email" className="mb-1.5 block text-xs font-bold text-[#755b00]">Email</label>
              <input id="staff-email" type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} maxLength={254} required className="w-full rounded-xl bg-[#FCF8F4] px-3.5 py-3 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]" />
            </div>
            <div>
              <label htmlFor="staff-role" className="mb-1.5 block text-xs font-bold text-[#755b00]">Role</label>
              <select id="staff-role" value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} className="w-full rounded-xl bg-[#FCF8F4] px-3.5 py-3 text-sm text-[#3a2b25] outline-none focus:ring-2 focus:ring-[#F8D272]">
                <option value="counselor">Counselor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} aria-busy={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F8D272] to-[#F6C945] px-5 text-xs font-black uppercase tracking-wide text-[#3E3006] shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <LoadingIndicator size={12} label="Sending invitation" /> : <MailPlus size={16} />}
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm" aria-labelledby="staff-list-heading">
          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <Shield size={17} className="text-[#8C6218]" />
              <h2 id="staff-list-heading" className="font-jakarta text-base font-extrabold text-[#3a2b25]">Staff accounts</h2>
            </div>
            <span className="text-xs font-semibold text-[#3a2b25]/50">{staff.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-[#FDF9F2] text-[10px] font-black uppercase tracking-wider text-[#AA8E7E]">
                <tr>
                  <th scope="col" className="px-5 py-3 sm:px-7">Name</th>
                  <th scope="col" className="px-5 py-3">Email</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 sm:px-7">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#AA8E7E]/10 text-sm text-[#3a2b25]">
                {loading ? (
                  <tr><td colSpan="5" className="px-5 py-12 text-center text-[#3a2b25]/55"><LoadingIndicator size={20} message="Loading staff…" /></td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-12 text-center text-[#3a2b25]/55">No staff accounts yet.</td></tr>
                ) : staff.map(member => (
                  <tr key={member.id}>
                    <td className="px-5 py-4 font-semibold sm:px-7">{member.full_name || 'Name unavailable'}</td>
                    <td className="px-5 py-4 text-[#3a2b25]/65">{member.email || 'Email unavailable'}</td>
                    <td className="px-5 py-4 capitalize">{member.role}</td>
                    <td className="px-5 py-4"><StatusBadge status={member.status} /></td>
                    <td className="px-5 py-3 sm:px-7">
                      <div className="flex flex-wrap gap-2">
                        {member.status === 'invited' && <>
                          <button type="button" disabled={Boolean(acting)} onClick={() => requestStaffAction(member, 'resend')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#FDF9F2] px-3 text-xs font-bold text-[#755b00] disabled:opacity-50"><RefreshCw size={13} />Resend</button>
                          <button type="button" disabled={Boolean(acting)} onClick={() => requestStaffAction(member, 'revoke')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"><UserRoundX size={13} />Revoke</button>
                        </>}
                        {member.status === 'active' && member.id !== user?.id && <button type="button" disabled={Boolean(acting)} onClick={() => requestStaffAction(member, 'deactivate')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"><UserRoundX size={13} />Deactivate</button>}
                        {member.status === 'disabled' && <button type="button" disabled={Boolean(acting)} onClick={() => requestStaffAction(member, 'reactivate')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#EAF2E6] px-3 text-xs font-bold text-[#2D5A29] disabled:opacity-50"><UserRoundCheck size={13} />Reactivate</button>}
                        {member.role === 'counselor' && member.id !== user?.id && <button type="button" disabled={Boolean(acting)} onClick={() => requestStaffAction(member, 'delete')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"><Trash2 size={13} />Delete</button>}
                        {acting?.startsWith(`${member.id}:`) && <LoadingIndicator size={12} label="Updating staff account" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {confirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241d1d]/45 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setConfirmation(null)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="staff-confirm-title"
            aria-describedby="staff-confirm-message"
            className="w-full max-w-sm rounded-2xl border border-warm/10 bg-white p-5 shadow-lift animate-scaleIn"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                confirmation.destructive ? 'bg-red-50 text-red-600' : 'bg-[#F6C945]/20 text-[#755b00]'
              }`}>
                <AlertCircle size={19} />
              </div>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg p-1.5 text-warm/45 transition hover:bg-surface-low hover:text-warm"
                aria-label="Cancel action"
              >
                <X size={17} />
              </button>
            </div>
            <h2 id="staff-confirm-title" className="font-jakarta text-base font-extrabold text-warm">
              {confirmation.title}
            </h2>
            <p id="staff-confirm-message" className="mt-2 text-sm leading-relaxed text-warm/65">
              {confirmation.message}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                ref={cancelConfirmationRef}
                onClick={() => setConfirmation(null)}
                className="min-h-10 rounded-xl border border-warm/15 px-4 text-xs font-bold text-warm/70 transition hover:bg-surface-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={submitting || Boolean(acting)}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmation.destructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#755b00] hover:bg-[#5d4900]'
                }`}
              >
                {(submitting || acting) && <LoadingIndicator size={12} label="Updating staff account" />}
                {confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
