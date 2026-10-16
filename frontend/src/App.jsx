import { useCallback, useEffect, useState, useMemo } from 'react'

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Copy,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X
} from 'lucide-react'

import {
  getCurrentUser,
  getDashboard,
  getTransactions,
  getTransactionById,
  loginUser,
  logoutUser,
  registerUser,
  creditMoney,
  debitMoney,
  transferMoney
} from './api/api'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

const money = amount =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))

const dateFormat = date => {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const dateTimeFormat = date => {
  if (!date) return '—'

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <Wallet size={23} />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Finora
        </h1>
        <p className="text-xs text-slate-500">Banking made simpler</p>
      </div>
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })

  const updateField = event => {
    setForm(previous => ({
      ...previous,
      [event.target.name]: event.target.value
    }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result =
        mode === 'register'
          ? await registerUser({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim()
            })
          : await loginUser({
              email: form.email.trim(),
              password: form.password
            })

      if (!result.user) {
        throw new Error('User details were not returned by the server.')
      }

      await onAuthenticated(result.user)
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <section className="hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex xl:p-16">
        <Brand />

        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-blue-200">
            <ShieldCheck size={17} />
            Secure personal banking
          </div>

          <h2 className="text-5xl font-bold leading-tight xl:text-6xl">
            Your money.
            <br />
            Your future.
            <br />
            <span className="text-blue-400">Your control.</span>
          </h2>

          <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
            Manage your account and track your financial activity in one place.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Finora · Bank Transaction System
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Welcome to Finora
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          <p className="mt-2 text-slate-500">
            {mode === 'login'
              ? 'Sign in to access your banking dashboard.'
              : 'Enter your details to get started.'}
          </p>

          <div className="my-7 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
            {['login', 'register'].map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item)
                  setError('')
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  mode === item
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {item === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone number
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="Your phone number"
                    autoComplete="tel"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(previous => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in to Finora'
                  : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-slate-500">
            <ShieldCheck className="mr-1 inline" size={14} />
            Your session is managed by your backend.
          </p>
        </div>
      </section>
    </div>
  )
}


function Sidebar({ view, setView, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = nextView => {
    setView(nextView)
    setMobileOpen(false)
  }

  const nav = (
    <div className="flex h-full flex-col p-5">
      <Brand />

      <p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Workspace
      </p>

      {/* Dashboard */}
      <button
        type="button"
        onClick={() => navigate('dashboard')}
        className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
          view === 'dashboard'
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <LayoutDashboard size={19} />
        Dashboard
      </button>

      {/* Transactions */}
      <button
        type="button"
        onClick={() => navigate('transactions')}
        className={`mt-2 flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
          view === 'transactions'
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <ArrowLeftRight size={19} />
        Transactions
      </button>

      {/* Money Operations */}
      <button
        type="button"
        onClick={() => navigate('money')}
        className={`mt-2 flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
          view === 'money'
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Wallet size={19} />
        Money Operations
      </button>

      {/* Security information */}
      <div className="mt-auto rounded-2xl bg-slate-950 p-4 text-white">
        <ShieldCheck className="mb-3 text-blue-300" size={25} />

        <p className="text-sm font-semibold">
          Keep your account safe
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Never share your password or authentication details.
        </p>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={onLogout}
        className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {nav}
      </aside>

      {/* Mobile menu button */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 left-5 z-20 rounded-full bg-blue-600 p-4 text-white shadow-lg lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />

          <aside className="absolute inset-y-0 left-0 w-72 bg-white">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            {nav}
          </aside>
        </div>
      )}
    </>
  )
}


function Header({ user, title, onRefresh, refreshing }) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
      <div>
        <p className="text-sm text-slate-500">Your workspace</p>
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="max-w-40">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatCard({ title, amount, icon: Icon, description, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {money(amount)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}


function DashboardAnalytics({ refreshKey }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError('')

        const firstPage = await getTransactions(1, 100)
        let allTransactions = firstPage.transactions || []

        const totalPages = firstPage.pagination?.totalPages || 1

        for (let page = 2; page <= totalPages; page++) {
          const result = await getTransactions(page, 100)
          allTransactions = allTransactions.concat(
            result.transactions || []
          )
        }

        if (!cancelled) {
          setTransactions(allTransactions)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load analytics')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const completedTransactions = useMemo(
    () =>
      transactions.filter(
        transaction =>
          String(transaction.status).toLowerCase() === 'completed'
      ),
    [transactions]
  )

  const monthlyData = useMemo(() => {
    const now = new Date()

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1
      )

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit'
        }),
        income: 0,
        expenses: 0
      }
    })

    const monthMap = new Map(
      months.map(month => [month.key, month])
    )

    completedTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt)

      if (Number.isNaN(date.getTime())) return

      const key = `${date.getFullYear()}-${date.getMonth()}`
      const month = monthMap.get(key)

      if (!month) return

      const amount = Number(transaction.amount) || 0
      const type = String(transaction.type).toLowerCase()

      if (type === 'credit') {
        month.income += amount
      } else if (type === 'debit') {
        month.expenses += amount
      }
    })

    return months
  }, [completedTransactions])

  const insights = useMemo(() => {
    const credits = completedTransactions
      .filter(
        transaction =>
          String(transaction.type).toLowerCase() === 'credit'
      )
      .reduce(
        (total, transaction) =>
          total + (Number(transaction.amount) || 0),
        0
      )

    const debits = completedTransactions
      .filter(
        transaction =>
          String(transaction.type).toLowerCase() === 'debit'
      )
      .reduce(
        (total, transaction) =>
          total + (Number(transaction.amount) || 0),
        0
      )

    return {
      credits,
      debits,
      count: completedTransactions.length
    }
  }, [completedTransactions])

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Loading transaction analytics...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">
          Analytics could not be loaded
        </p>

        <p className="mt-1 text-sm text-amber-800">
          {error}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">
          Financial analytics
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your account activity at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ArrowDownLeft size={17} className="text-emerald-600" />
            Recorded income
          </div>

          <p className="mt-3 text-2xl font-bold text-emerald-600">
            {money(insights.credits)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Completed credit transactions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ArrowUpRight size={17} className="text-rose-600" />
            Recorded expenses
          </div>

          <p className="mt-3 text-2xl font-bold text-rose-600">
            {money(insights.debits)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Completed debit transactions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ArrowLeftRight size={17} className="text-blue-600" />
            Completed transactions
          </div>

          <p className="mt-3 text-2xl font-bold">
            {insights.count}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Successfully completed operations
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold">
            Income vs. expenses
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Monthly totals for the last six calendar months
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{
                top: 8,
                right: 8,
                left: 8,
                bottom: 4
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={value => `₹${value}`}
                width={75}
              />

              <Tooltip
                formatter={(value, name) => [
                  money(value),
                  name
                ]}
              />

              <Legend />

              <Bar
                dataKey="income"
                name="Income"
                fill="#059669"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#e11d48"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {completedTransactions.length === 0 && (
          <p className="mt-3 text-center text-sm text-slate-500">
            No completed transactions are available to chart yet.
          </p>
        )}
      </div>
    </section>
  )
}

function DashboardView({
  user,
  dashboard,
  dashboardError,
  onRetry,
  analyticsRefreshKey
}) {
  const [showAccountDetails, setShowAccountDetails] = useState(false)
  const [accountNumberCopied, setAccountNumberCopied] = useState(false)

  const account = dashboard?.account || {}
  const summary = dashboard?.summary || {}
  const transactions = dashboard?.recentTransactions || []
  const firstName = (user?.name || 'User').trim().split(/\s+/)[0]

  const closeAccountDetails = () => {
    setShowAccountDetails(false)
    setAccountNumberCopied(false)
  }

  const copyAccountNumber = async () => {
    if (!account.accountNumber) return

    try {
      await navigator.clipboard.writeText(String(account.accountNumber))
      setAccountNumberCopied(true)
    } catch {
      setAccountNumberCopied(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
      {/* Dashboard heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Good to see you, {firstName}!
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here's an overview of your account activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          <CheckCircle2 size={15} />
          Signed in
        </div>
      </section>

      {/* Dashboard error */}
      {dashboardError && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
        >
          <p className="font-semibold text-amber-900">
            Unable to load account data
          </p>

          <p className="mt-2 text-sm text-amber-800">
            {dashboardError}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Balance and clickable account details card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Wallet size={18} />
              Available balance
            </div>

            <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {money(account.balance)}
            </p>

            <p className="mt-3 text-sm text-blue-100">
              {account.currency || 'INR'} · {account.status || 'Account'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAccountNumberCopied(false)
              setShowAccountDetails(true)
            }}
            aria-haspopup="dialog"
            className="rounded-2xl border border-white/20 bg-white/10 p-5 text-left backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70 sm:min-w-56"
          >
            <span className="flex items-center gap-2 text-sm text-blue-100">
              <CreditCard size={17} />
              Account details
            </span>

            <span className="mt-4 block text-lg font-semibold">
              {account.accountType || 'Bank Account'}
            </span>

            <span className="mt-1 block text-sm tracking-widest text-blue-100">
              {account.accountNumber
                ? `•••• ${String(account.accountNumber).slice(-4)}`
                : 'Account number unavailable'}
            </span>

            <span className="mt-3 block text-xs font-semibold text-white">
              View full details →
            </span>
          </button>
        </div>
      </section>

      {/* Account summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total credits"
          amount={summary.totalCredits}
          icon={ArrowDownLeft}
          description="Total credited transaction amount"
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Total debits"
          amount={summary.totalDebits}
          icon={ArrowUpRight}
          description="Total debited transaction amount"
          iconClass="bg-rose-50 text-rose-600"
        />

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">
            Transactions
          </p>

          <p className="mt-3 text-2xl font-bold">
            {summary.totalTransactions ?? 0}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Total recorded transactions
          </p>
        </div>
      </section>

      {/* Financial analytics */}
      <DashboardAnalytics refreshKey={analyticsRefreshKey} />

      {/* Recent transactions */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h3 className="text-lg font-bold">
            Recent transactions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your latest recorded account activity
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction, index) => {
              const isCredit =
                String(transaction.type).toLowerCase() === 'credit'

              return (
                <div
                  key={
                    transaction.transactionId ||
                    transaction._id ||
                    index
                  }
                  className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isCredit
                        ? <ArrowDownLeft size={21} />
                        : <ArrowUpRight size={21} />}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {transaction.description ||
                          `${transaction.type} transaction`}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {dateFormat(transaction.createdAt)} · {transaction.status}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-bold ${
                      isCredit
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {isCredit ? '+' : '−'}
                    {money(transaction.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Account details modal */}
      {showAccountDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={closeAccountDetails}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-details-title"
            className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            {/* Fixed modal header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div>
                <h2
                  id="account-details-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Account Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your personal and banking information
                </p>
              </div>

              <button
                type="button"
                aria-label="Close account details"
                onClick={closeAccountDetails}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable modal content */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
              {/* Account number card */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-5 text-white">
                <p className="text-sm text-blue-100">
                  Account number
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="break-all text-lg font-semibold tracking-wider">
                    {account.accountNumber || 'Not available'}
                  </p>

                  {account.accountNumber && (
                    <button
                      type="button"
                      aria-label="Copy account number"
                      onClick={copyAccountNumber}
                      className="shrink-0 rounded-lg p-2 transition hover:bg-white/15"
                    >
                      {accountNumberCopied
                        ? <CheckCircle2 size={19} />
                        : <Copy size={19} />}
                    </button>
                  )}
                </div>

                {accountNumberCopied && (
                  <p className="mt-2 text-xs text-blue-100">
                    Account number copied
                  </p>
                )}
              </div>

              {/* Personal and account information */}
              <div className="space-y-0">
                {[
                  ['Full name', user?.name],
                  ['Email address', user?.email],
                  ['Phone number', user?.phone],
                  ['Account type', account.accountType],
                  ['Account balance', money(account.balance)],
                  ['Currency', account.currency || 'INR'],
                  ['Account status', account.status],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-b-0"
                  >
                    <p className="shrink-0 text-sm text-slate-500">
                      {label}
                    </p>

                    <p className="break-all text-right text-sm font-semibold text-slate-900">
                      {value ?? 'Not available'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed modal footer */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={closeAccountDetails}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function TransactionsView() {
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  })

  const [page, setPage] = useState(1)

  const [result, setResult] = useState({
    transactions: [],
    pagination: {
      page: 1,
      limit: 10,
      totalTransactions: 0,
      totalPages: 0
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // Transaction details state
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch transactions without updating React state.
  const fetchTransactions = useCallback(async () => {
    return getTransactions(page, 10, filters)
  }, [page, filters])

  // Load transactions when the page or filters change.
  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const data = await fetchTransactions()

        if (cancelled) return

        setResult({
          transactions: data.transactions || [],
          pagination: data.pagination || {
            page,
            limit: 10,
            totalTransactions: 0,
            totalPages: 0
          }
        })

        setError('')
      } catch (err) {
        if (cancelled) return

        setError(err.message || 'Unable to load transactions.')

        setResult({
          transactions: [],
          pagination: {
            page,
            limit: 10,
            totalTransactions: 0,
            totalPages: 0
          }
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [fetchTransactions, page])

  // Refresh button handler
  const loadTransactions = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchTransactions()

      setResult({
        transactions: data.transactions || [],
        pagination: data.pagination || {
          page,
          limit: 10,
          totalTransactions: 0,
          totalPages: 0
        }
      })
    } catch (err) {
      setError(err.message || 'Unable to load transactions.')

      setResult({
        transactions: [],
        pagination: {
          page,
          limit: 10,
          totalTransactions: 0,
          totalPages: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (name, value) => {
    setLoading(true)
    setPage(1)

    setFilters(previous => ({
      ...previous,
      [name]: value
    }))
  }

  const clearFilters = () => {
    setLoading(true)
    setPage(1)

    setFilters({
      type: 'all',
      startDate: '',
      endDate: ''
    })

    setExportError('')
  }

  // Open a transaction's details
  const openTransactionDetails = async transaction => {
    setSelectedTransaction(null)
    setDetailsError('')
    setCopied(false)
    setDetailsLoading(true)

    try {
      const id = transaction.transactionId || transaction._id

      if (!id) {
        throw new Error('Transaction ID is unavailable.')
      }

      const data = await getTransactionById(id)
      const details = data.transaction || data.data || data

      if (!details || !(details.transactionId || details._id)) {
        throw new Error('Transaction details could not be found.')
      }

      setSelectedTransaction(details)
    } catch (err) {
      setDetailsError(
        err.message || 'Unable to load transaction details.'
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeTransactionDetails = () => {
    setSelectedTransaction(null)
    setDetailsError('')
    setDetailsLoading(false)
    setCopied(false)
  }

  const copyTransactionId = async () => {
    const id =
      selectedTransaction?.transactionId ||
      selectedTransaction?._id

    if (!id) return

    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
    } catch {
      setDetailsError(
        'Unable to copy the transaction ID. Please copy it manually.'
      )
    }
  }

  // Fetch all pages matching the selected filters for exports
  const getAllFilteredTransactions = async () => {
    const limit = 100
    const firstPage = await getTransactions(1, limit, filters)
    const allTransactions = [...(firstPage.transactions || [])]
    const totalPages = firstPage.pagination?.totalPages || 1

    for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
      const data = await getTransactions(currentPage, limit, filters)
      allTransactions.push(...(data.transactions || []))
    }

    return allTransactions
  }

  const getStatementFilename = extension => {
    const from = filters.startDate || 'all-dates'
    const to = filters.endDate || 'all-dates'

    return `Finora-Statement-${from}-to-${to}.${extension}`
  }

  // Export CSV
  const exportCSV = async () => {
    setExporting(true)
    setExportError('')

    try {
      const allTransactions = await getAllFilteredTransactions()

      if (!allTransactions.length) {
        setExportError('No transactions found for the selected filters.')
        return
      }

      const escapeCSV = value =>
        `"${String(value ?? '').replace(/"/g, '""')}"`

      const rows = [
        [
          'Transaction ID',
          'Date',
          'Type',
          'Description',
          'Status',
          'Amount (INR)'
        ],
        ...allTransactions.map(transaction => [
          transaction.transactionId || transaction._id || '',
          transaction.createdAt
            ? new Date(transaction.createdAt).toLocaleString('en-IN')
            : '',
          transaction.type || '',
          transaction.description || '',
          transaction.status || '',
          Number(transaction.amount || 0).toFixed(2)
        ])
      ]

      const csv =
        '\uFEFF' +
        rows
          .map(row => row.map(escapeCSV).join(','))
          .join('\r\n')

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = getStatementFilename('csv')

      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(
        err.message || 'Unable to export the CSV statement.'
      )
    } finally {
      setExporting(false)
    }
  }

  // Export PDF statement
  const exportPDF = async () => {
    setExporting(true)
    setExportError('')

    try {
      const { jsPDF } = await import('jspdf')

      const allTransactions = await getAllFilteredTransactions()

      if (!allTransactions.length) {
        setExportError('No transactions found for the selected filters.')
        return
      }

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 14
      let y = 20

      const credits = allTransactions
        .filter(
          transaction =>
            String(transaction.type).toLowerCase() === 'credit'
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )

      const debits = allTransactions
        .filter(
          transaction =>
            String(transaction.type).toLowerCase() === 'debit'
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text('FINORA', margin, y)

      y += 9
      doc.setFontSize(15)
      doc.text('Bank Statement', margin, y)

      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.text(
        `Period: ${filters.startDate || 'All dates'} to ${filters.endDate || 'All dates'}`,
        margin,
        y
      )

      y += 7
      doc.text(`Transaction type: ${filters.type}`, margin, y)

      y += 12
      doc.setFont('helvetica', 'bold')
      doc.text(`Total credits: INR ${credits.toFixed(2)}`, margin, y)

      y += 7
      doc.text(`Total debits: INR ${debits.toFixed(2)}`, margin, y)

      y += 7
      doc.text(`Transactions: ${allTransactions.length}`, margin, y)

      y += 12

      const columns = [
        { x: 14, width: 29, label: 'Date' },
        { x: 44, width: 42, label: 'Transaction ID' },
        { x: 87, width: 19, label: 'Type' },
        { x: 107, width: 27, label: 'Status' },
        { x: 135, width: 45, label: 'Amount (INR)' }
      ]

      const drawTableHeader = () => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)

        columns.forEach(column => {
          doc.text(column.label, column.x, y)
        })

        y += 5
        doc.setFont('helvetica', 'normal')
      }

      drawTableHeader()

      allTransactions.forEach(transaction => {
        if (y > pageHeight - 18) {
          doc.addPage()
          y = 18
          drawTableHeader()
        }

        const date = transaction.createdAt
          ? new Date(transaction.createdAt).toLocaleDateString('en-IN')
          : '—'

        const values = [
          date,
          transaction.transactionId || transaction._id || '—',
          transaction.type || '—',
          transaction.status || '—',
          Number(transaction.amount || 0).toFixed(2)
        ]

        doc.setFontSize(8)

        columns.forEach((column, index) => {
          const lines = doc.splitTextToSize(
            String(values[index]),
            column.width
          )

          doc.text(lines[0] || '', column.x, y)
        })

        y += 7
        doc.setDrawColor(230, 230, 230)
        doc.line(margin, y - 3, pageWidth - margin, y - 3)
      })

      doc.save(getStatementFilename('pdf'))
    } catch (err) {
      setExportError(
        err.message || 'Unable to export the PDF statement.'
      )
    } finally {
      setExporting(false)
    }
  }

  const pagination = result.pagination
  const transactions = result.transactions

  const detailId =
    selectedTransaction?.transactionId || selectedTransaction?._id

  const detailIsCredit =
    String(selectedTransaction?.type).toLowerCase() === 'credit'

  const detailStatus =
    String(selectedTransaction?.status || '').toLowerCase()

  const detailIsSuccessful =
    ['completed', 'success'].includes(detailStatus)

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Transactions
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Browse, filter, view details, and export your account activity.
        </p>
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Transaction type
            </label>

            <select
              value={filters.type}
              onChange={event =>
                updateFilter('type', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All transactions</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              From date
            </label>

            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={event =>
                updateFilter('startDate', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              To date
            </label>

            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={event =>
                updateFilter('endDate', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Transaction history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Transaction history</h2>

            <p className="mt-1 text-sm text-slate-500">
              {pagination.totalTransactions} transaction(s) found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Select a transaction row to view its details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              disabled={exporting || loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <button
              type="button"
              onClick={exportPDF}
              disabled={exporting || loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>

            <button
              type="button"
              onClick={loadTransactions}
              disabled={loading || exporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {exportError && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {exportError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-slate-500">
            <RefreshCw
              size={20}
              className="animate-spin text-blue-600"
            />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ArrowLeftRight
              className="mx-auto text-slate-300"
              size={34}
            />

            <h3 className="mt-4 font-semibold text-slate-800">
              No transactions found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Transaction
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction, index) => {
                    const isCredit =
                      String(transaction.type).toLowerCase() === 'credit'

                    return (
                      <tr
                        key={
                          transaction.transactionId ||
                          transaction._id ||
                          index
                        }
                        onClick={() =>
                          openTransactionDetails(transaction)
                        }
                        onKeyDown={event => {
                          if (
                            event.key === 'Enter' ||
                            event.key === ' '
                          ) {
                            event.preventDefault()
                            openTransactionDetails(transaction)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${transaction.transactionId || 'transaction'}`}
                        className="cursor-pointer transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                isCredit
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft size={19} />
                              ) : (
                                <ArrowUpRight size={19} />
                              )}
                            </div>

                            <span className="max-w-52 truncate text-sm font-semibold text-slate-800">
                              {transaction.description ||
                                `${transaction.type} transaction`}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {transaction.transactionId || '—'}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              isCredit
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {transaction.type || 'unknown'}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {dateTimeFormat(transaction.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              ['completed', 'success'].includes(
                                String(transaction.status).toLowerCase()
                              )
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {transaction.status || 'unknown'}
                          </span>
                        </td>

                        <td
                          className={`px-6 py-5 text-right text-sm font-bold ${
                            isCredit
                              ? 'text-emerald-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {isCredit ? '+' : '−'}
                          {money(transaction.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">
                Page {pagination.page || page} of{' '}
                {Math.max(pagination.totalPages || 0, 1)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    setLoading(true)
                    setPage(current => Math.max(1, current - 1))
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages ||
                    loading ||
                    !pagination.totalPages
                  }
                  onClick={() => {
                    setLoading(true)
                    setPage(current => current + 1)
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Transaction details modal */}
      {(detailsLoading || detailsError || selectedTransaction) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeTransactionDetails()
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-widest text-blue-600">
                  FINORA
                </p>

                <h2
                  id="transaction-details-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Transaction Details
                </h2>
              </div>

              <button
                type="button"
                onClick={closeTransactionDetails}
                aria-label="Close transaction details"
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            {detailsLoading && (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <RefreshCw
                  size={20}
                  className="animate-spin text-blue-600"
                />
                Loading transaction details...
              </div>
            )}

            {detailsError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {detailsError}
              </div>
            )}

            {selectedTransaction && (
              <>
                <div className="rounded-2xl bg-slate-50 p-5 text-center">
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                      detailIsCredit
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {detailIsCredit ? (
                      <ArrowDownLeft size={24} />
                    ) : (
                      <ArrowUpRight size={24} />
                    )}
                  </div>

                  <p className="mt-3 text-sm capitalize text-slate-500">
                    {selectedTransaction.type || 'Transaction'}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {detailIsCredit ? '+' : '−'}
                    {money(selectedTransaction.amount)}
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      detailIsSuccessful
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedTransaction.status || 'Unknown status'}
                  </span>
                </div>

                <div className="mt-5 divide-y divide-slate-100">
                  <div className="flex items-start justify-between gap-4 py-3 text-sm">
                    <span className="shrink-0 text-slate-500">
                      Transaction ID
                    </span>

                    <div className="flex min-w-0 items-start gap-2">
                      <span className="break-all text-right font-medium text-slate-800">
                        {detailId || '—'}
                      </span>

                      {detailId && (
                        <button
                          type="button"
                          onClick={copyTransactionId}
                          title="Copy transaction ID"
                          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium capitalize text-slate-800">
                      {selectedTransaction.type || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">Description</span>
                    <span className="max-w-[65%] break-words text-right font-medium text-slate-800">
                      {selectedTransaction.description || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">Date and time</span>
                    <span className="text-right font-medium text-slate-800">
                      {selectedTransaction.createdAt
                        ? dateTimeFormat(selectedTransaction.createdAt)
                        : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium capitalize text-slate-800">
                      {selectedTransaction.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <FileText size={18} />
                  Print / Save as PDF
                </button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Use your browser's print dialog to save a PDF receipt.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={closeTransactionDetails}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

function MoneyOperationsView({ onSuccess }) {
  const [operation, setOperation] = useState('credit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [copied, setCopied] = useState(false)

  const formatMoney = (value, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value ?? 0))

  const formatDate = value => {
    if (!value) return 'Not available'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const handleCopy = async transactionId => {
    if (!transactionId) return

    try {
      await navigator.clipboard.writeText(transactionId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError(
        'Unable to copy the transaction ID. Please copy it manually.'
      )
    }
  }

  const renderTransactionId = (label, transactionId) => (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-500">
        {label}
      </span>

      <div className="flex max-w-[65%] items-start gap-2">
        <span className="break-all text-right text-sm text-slate-900">
          {transactionId}
        </span>

        <button
          type="button"
          onClick={() => handleCopy(transactionId)}
          title="Copy transaction ID"
          aria-label="Copy transaction ID"
          className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Copy size={15} />
        </button>
      </div>
    </div>
  )

  const handleSubmit = async event => {
    event.preventDefault()

    setError('')
    setMessage('')
    setReceipt(null)
    setCopied(false)

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than zero.')
      return
    }

    if (
      operation === 'transfer' &&
      !receiverAccountNumber.trim()
    ) {
      setError('Please enter the receiver account number.')
      return
    }

    setLoading(true)

    try {
      const transactionData = {
        amount: numericAmount,
        description: description.trim(),
        idempotencyKey: crypto.randomUUID()
      }

      let response

      if (operation === 'credit') {
        response = await creditMoney(transactionData)
      } else if (operation === 'debit') {
        response = await debitMoney(transactionData)
      } else {
        response = await transferMoney({
          ...transactionData,
          receiverAccountNumber: receiverAccountNumber.trim()
        })
      }

      const transaction = response?.transaction ?? {}
      const debit = response?.debit ?? {}
      const senderAccount = response?.senderAccount ?? {}
      const account = response?.account ?? {}

      const transactionId =
        transaction.transactionId ??
        transaction.id ??
        debit.transactionId ??
        response?.transactionId ??
        null

      const createdAt =
        transaction.createdAt ??
        debit.createdAt ??
        response?.createdAt ??
        new Date().toISOString()

      const balance =
        operation === 'transfer'
          ? senderAccount.balance
          : account.balance

      const currency =
        operation === 'transfer'
          ? senderAccount.currency
          : account.currency

      setReceipt({
        operation,
        amount: numericAmount,
        status:
          transaction.status ??
          debit.status ??
          response?.transfer?.status ??
          'completed',
        transactionId,
        debitTransactionId:
          operation === 'transfer'
            ? debit.transactionId ?? transactionId
            : null,
        createdAt,
        balance:
          balance === undefined || balance === null
            ? null
            : Number(balance),
        currency: currency || 'INR',
        receiverAccountNumber:
          operation === 'transfer'
            ? receiverAccountNumber.trim()
            : null,
        description: description.trim()
      })

      setMessage(
        response?.message ||
          (operation === 'transfer'
            ? 'Money transferred successfully.'
            : operation === 'credit'
              ? 'Money credited successfully.'
              : 'Money debited successfully.')
      )

      setAmount('')
      setDescription('')
      setReceiverAccountNumber('')

      if (onSuccess) {
        await onSuccess()
      }
    } catch (err) {
      setError(
        err?.message ||
          'The transaction could not be completed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!receipt) return

    const { jsPDF } = await import('jspdf')
     const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    const rightEdge = pageWidth - margin

    const formatPdfMoney = value =>
      `INR ${Number(value ?? 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`

    const safeText = value => String(value ?? 'Not provided')

    // Finora branded header
    pdf.setFillColor(15, 23, 42)
    pdf.rect(0, 0, pageWidth, 53, 'F')

    // Simple icon-based logo
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(margin, 12, 15, 15, 3, 3, 'F')

    pdf.setDrawColor(15, 23, 42)
    pdf.setLineWidth(0.8)
    pdf.line(margin + 4, 23, margin + 11, 23)
    pdf.line(margin + 5, 20, margin + 10, 20)
    pdf.line(margin + 6, 17, margin + 9, 17)

    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(22)
    pdf.text('Finora', margin + 20, 20)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(203, 213, 225)
    pdf.text('Banking made simpler', margin + 20, 27)
    pdf.text('TRANSACTION RECEIPT', margin, 43)

    // Amount and status panel
    let y = 69

    pdf.setFillColor(240, 253, 244)
    pdf.roundedRect(
      margin,
      y - 7,
      contentWidth,
      39,
      4,
      4,
      'F'
    )

    pdf.setTextColor(22, 101, 52)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('TRANSACTION AMOUNT', margin + 6, y + 1)

    pdf.setTextColor(15, 23, 42)
    pdf.setFontSize(21)
    pdf.text(formatPdfMoney(receipt.amount), margin + 6, y + 13)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(22, 101, 52)
    pdf.text(
      `Status: ${safeText(receipt.status).toUpperCase()}`,
      margin + 6,
      y + 24
    )

    y += 45

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('Transaction details', margin, y)

    y += 8

    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, y, rightEdge, y)

    y += 10

    const addRow = (label, value) => {
      const labelWidth = 43
      const valueX = margin + labelWidth
      const valueWidth = contentWidth - labelWidth

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)

      const lines = pdf.splitTextToSize(
        safeText(value),
        valueWidth
      )

      const rowHeight = Math.max(7, lines.length * 5)

      if (y + rowHeight + 9 > pageHeight - 35) {
        pdf.addPage()
        y = 25
      }

      pdf.setTextColor(100, 116, 139)
      pdf.text(label, margin, y)

      pdf.setTextColor(15, 23, 42)
      pdf.text(lines, valueX, y)

      y += rowHeight + 8

      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y - 3, rightEdge, y - 3)
    }

    addRow('Operation', receipt.operation)

    if (receipt.transactionId) {
      addRow('Transaction ID', receipt.transactionId)
    }

    if (
      receipt.operation === 'transfer' &&
      receipt.debitTransactionId &&
      receipt.debitTransactionId !== receipt.transactionId
    ) {
      addRow('Sender Debit ID', receipt.debitTransactionId)
    }

    if (receipt.operation === 'transfer') {
      addRow('Receiver Account', receipt.receiverAccountNumber)
    }

    addRow('Description', receipt.description || 'Not provided')
    addRow('Date and Time', formatDate(receipt.createdAt))

    // Updated account balance
    if (receipt.balance !== null) {
      const balanceHeight = 27

      if (y + balanceHeight + 15 > pageHeight - 25) {
        pdf.addPage()
        y = 25
      }

      y += 3

      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        balanceHeight,
        3,
        3,
        'F'
      )

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(100, 116, 139)
      pdf.text(
        'Updated Account Balance',
        margin + 5,
        y + 10
      )

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(15, 23, 42)
      pdf.text(
        formatPdfMoney(receipt.balance),
        margin + 5,
        y + 20
      )

      y += balanceHeight + 10
    }

    // Footer
    if (y + 15 > pageHeight - 8) {
      pdf.addPage()
      y = 25
    }

    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, y, rightEdge, y)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Generated by Finora', margin, y + 7)
    pdf.text(
      'Please retain this receipt for your records.',
      margin,
      y + 12
    )

    const reference =
      receipt.transactionId ||
      receipt.debitTransactionId ||
      `${receipt.operation}-${Date.now()}`

    const filename =
      `Finora-Receipt-${String(reference).replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`

    pdf.save(filename)
  }

  return (
    <div className="money-operations-page mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Money Operations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Credit, debit, or transfer money securely.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid grid-cols-3 gap-2">
          {['credit', 'debit', 'transfer'].map(item => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setOperation(item)
                setMessage('')
                setError('')
                setReceipt(null)
                setCopied(false)
              }}
              className={`rounded-xl px-3 py-3 text-sm font-semibold capitalize transition ${
                operation === item
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {message && (
          <div
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={18} />
              {message}
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {copied && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-700">
            <CheckCircle2 size={17} />
            Transaction ID copied successfully!
          </div>
        )}
      </div>

      {receipt && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {/* Finora branded header */}
          <div className="bg-slate-900 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-900">
                <Landmark size={27} />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Finora
                </h2>
                <p className="text-sm text-slate-300">
                  Banking made simpler
                </p>
              </div>

              <ShieldCheck
                size={26}
                className="text-emerald-400"
              />
            </div>

            <div className="mt-5 border-t border-slate-700 pt-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-300">
                TRANSACTION RECEIPT
              </p>
            </div>
          </div>

          {/* Amount and status */}
          <div className="border-b border-slate-100 bg-emerald-50 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Transaction amount
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {formatMoney(receipt.amount, receipt.currency)}
            </h3>

            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700">
                <CheckCircle2 size={15} />
                {receipt.status}
              </span>
            </div>
          </div>

          {/* Transaction details */}
          <div className="space-y-5 p-6">
            <h3 className="text-base font-bold text-slate-900">
              Transaction details
            </h3>

            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-slate-500">
                Operation
              </span>
              <span className="text-sm font-semibold capitalize text-slate-900">
                {receipt.operation}
              </span>
            </div>

            {receipt.transactionId &&
              receipt.operation !== 'transfer' &&
              renderTransactionId(
                'Transaction ID',
                receipt.transactionId
              )}

            {receipt.operation === 'transfer' &&
              receipt.debitTransactionId &&
              renderTransactionId(
                'Sender debit transaction ID',
                receipt.debitTransactionId
              )}

            {receipt.operation === 'transfer' && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Receiver account
                </span>
                <span className="max-w-[60%] break-all text-right text-sm font-medium text-slate-900">
                  {receipt.receiverAccountNumber}
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-slate-500">
                Description
              </span>
              <span className="max-w-[60%] break-words text-right text-sm font-medium text-slate-900">
                {receipt.description || 'Not provided'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-slate-500">
                Date and time
              </span>
              <span className="text-right text-sm font-medium text-slate-900">
                {formatDate(receipt.createdAt)}
              </span>
            </div>

            {/* Updated balance */}
            {receipt.balance !== null && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Wallet size={17} />
                  <p className="text-sm">
                    Updated account balance
                  </p>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatMoney(receipt.balance, receipt.currency)}
                </p>
              </div>
            )}
          </div>

          {/* Only one receipt action */}
          <div className="space-y-3 border-t border-slate-100 bg-white p-5">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <Download size={18} />
              Download Receipt (PDF)
            </button>

            <p className="text-center text-xs text-slate-500">
              Keep this receipt for your transaction records.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {operation === 'transfer' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Receiver account number
              </label>
              <input
                required
                value={receiverAccountNumber}
                onChange={event =>
                  setReceiverAccountNumber(event.target.value)
                }
                placeholder="Enter receiver's account number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount (₹)
            </label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              required
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="e.g. Monthly savings or bill payment"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : `${operation === 'credit'
                  ? 'Credit'
                  : operation === 'debit'
                    ? 'Debit'
                    : 'Transfer'} Money`}
          </button>
        </form>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
        <Wallet size={27} />
      </div>
      <RefreshCw className="mt-6 animate-spin text-blue-600" size={23} />
      <p className="mt-3 text-sm font-medium text-slate-600">
        Loading Finora...
      </p>
    </div>
  )
}

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState(null)
  const [view, setView] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [authError, setAuthError] = useState('')
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0)

  const loadDashboard = useCallback(async () => {
    setRefreshing(true)
    setDashboardError('')

    try {
      const data = await getDashboard()
      setDashboard(data)
    } catch (error) {
      setDashboard(null)
      setDashboardError(
        error.message || 'Unable to load dashboard data.'
      )
    } finally {
      setRefreshing(false)
      setAnalyticsRefreshKey(previous => previous + 1)
    }
  }, [])

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const result = await getCurrentUser()
        if (!active) return

        setUser(result.user)

        try {
          const data = await getDashboard()
          if (active) setDashboard(data)
        } catch (error) {
          if (active) {
            setDashboard(null)
            setDashboardError(error.message || 'Unable to load dashboard data.')
          }
        }
      } catch {
        if (active) {
          setUser(null)
          setDashboard(null)
        }
      } finally {
        if (active) setCheckingAuth(false)
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  const handleAuthenticated = async authenticatedUser => {
    setUser(authenticatedUser)
    setView('dashboard')
    setAuthError('')
    await loadDashboard()
  }

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout request failed:', error.message)
    } finally {
      setUser(null)
      setDashboard(null)
      setDashboardError('')
      setView('dashboard')
      setLoggingOut(false)
    }
  }

  const refreshCurrentView = () => {
    if (view === 'dashboard') {
      loadDashboard()
    } else {
      window.dispatchEvent(new Event('finora-refresh-transactions'))
    }
  }

  if (checkingAuth || loggingOut) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={async authenticatedUser => {
          try {
            await handleAuthenticated(authenticatedUser)
          } catch (error) {
            setAuthError(error.message || 'Unable to load your account.')
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        view={view}
        setView={setView}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-64">
        <Header
          user={user}
          title={view === 'dashboard' ? 'Dashboard' : 'Transactions'}
          onRefresh={refreshCurrentView}
          refreshing={refreshing}
        />

        {authError && (
          <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:mx-8">
            {authError}
          </div>
        )}

        {view === 'dashboard' ? (
          <DashboardView
            user={user}
            dashboard={dashboard}
            dashboardError={dashboardError}
            onRetry={loadDashboard}
            analyticsRefreshKey={analyticsRefreshKey}
          />
        ) : view === 'transactions' ? (
          <TransactionsView key="transactions" />
        ) : view === 'money' ? (
          <MoneyOperationsView
            onSuccess={loadDashboard}
          />
        ) : null}
      </div>
    </div>
  )
}
