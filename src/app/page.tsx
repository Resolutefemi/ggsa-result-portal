/**
 * God Generals Standard Academy - Result Portal (single-page app)
 *
 * Views (state-driven, since only the `/` route is exposed in the sandbox):
 *   1. home           - public landing page with "Check Result" + hidden 3-click teacher login
 *   2. student-check  - student enters admission number + PIN + term to view result
 *   3. student-result - displays the printable result sheet (with download/print button)
 *   4. teacher-login  - revealed by clicking the school logo 3 times
 *   5. teacher-dash   - list of classes assigned to teacher
 *   6. teacher-students - list of students in a class with result status
 *   7. teacher-edit   - result input form (auto-calc grade/total, position on finalize)
 *   8. admin-manage   - admin tools (manage students/teachers/classes)
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap,
  LogIn,
  LogOut,
  Search,
  Eye,
  Download,
  ArrowLeft,
  Users,
  School,
  ClipboardList,
  Lock,
  CheckCircle2,
  FileText,
  ChevronRight,
  UserPlus,
  Trash2,
  Pencil,
  Save,
  CheckCheck,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Shield,
  Menu,
} from 'lucide-react';
import { ResultSheet } from '@/components/result-sheet';
import { TeacherEditForm } from '@/components/teacher-edit-form';
import { AdminPanel } from '@/components/admin-panel';

type View =
  | 'home'
  | 'student-check'
  | 'student-result'
  | 'teacher-login'
  | 'teacher-signup'
  | 'teacher-dash'
  | 'teacher-students'
  | 'teacher-edit'
  | 'admin-manage';

interface Teacher {
  id: string;
  username: string;
  fullName: string;
  role: 'TEACHER' | 'ADMIN';
  subject?: string | null;
}

interface SchoolClass {
  id: string;
  name: string;
  category: string;
  studentCount: number;
  subject?: string | null;
}

interface StudentListItem {
  id: string;
  name: string;
  admissionNumber?: string | null;
  sex: string;
  house?: string | null;
  year: string | null;
  latestResult: {
    id: string;
    term: string;
    session: string;
    status: string;
  } | null;
}

interface StudentResultData {
  student: any;
  result: any;
  items: any[];
  traits: any[];
}

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<any>(null);

  // Teacher dashboard state
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedSession, setSelectedSession] = useState('2025/2026');

  // Student-facing result data
  const [studentResultData, setStudentResultData] = useState<StudentResultData | null>(null);

  const { toast } = useToast();

  // === Check existing session on mount ===
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setTeacher(data.teacher);
        }
      })
      .catch(() => {});
  }, []);

  // === Hidden teacher-login via 3 clicks on the school logo ===
  const handleLogoClick = useCallback(() => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (logoClickTimer) clearTimeout(logoClickTimer);
    const t = setTimeout(() => setLogoClicks(0), 800);
    setLogoClickTimer(t);
    if (next >= 3) {
      setLogoClicks(0);
      if (teacher) {
        setView('teacher-dash');
      } else {
        setView('teacher-login');
      }
    }
  }, [logoClicks, logoClickTimer, teacher]);

  // === Load teacher classes when entering dashboard ===
  useEffect(() => {
    if ((view === 'teacher-dash' || view === 'admin-manage') && teacher) {
      fetch('/api/teacher/classes')
        .then((r) => r.json())
        .then((d) => setClasses(d.classes || []))
        .catch(() => toast({ title: 'Failed to load classes', variant: 'destructive' }));
    }
  }, [view, teacher, toast]);

  // === Load students when class is selected ===
  useEffect(() => {
    if (view === 'teacher-students' && selectedClass) {
      fetch(`/api/teacher/students?classId=${selectedClass.id}`)
        .then((r) => r.json())
        .then((d) => setStudents(d.students || []))
        .catch(() => toast({ title: 'Failed to load students', variant: 'destructive' }));
    }
  }, [view, selectedClass, toast]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setTeacher(null);
    setView('home');
    toast({ title: 'Logged out' });
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-purple-50">
      {/* Top bar — slim navbar (60px mobile / 70px desktop) */}
      <header className="no-print sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 flex items-center justify-between gap-2 h-[60px] sm:h-[70px]">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 sm:gap-3 group flex-shrink min-w-0 h-full"
            aria-label="Home"
          >
            <img
              src="/logo-transparent.png"
              alt="GGSA Logo"
              className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
              style={{ backgroundColor: 'transparent' }}
              draggable={false}
            />
            <div className="text-left hidden sm:block min-w-0">
              <div className="text-sm sm:text-base font-bold text-ggsa-purple leading-tight truncate">
                God Generals Standard Academy
              </div>
              <div className="text-xs text-muted-foreground">Ikare-Akoko, Ondo State</div>
            </div>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {teacher ? (
              <>
                <span className="hidden lg:inline text-sm text-muted-foreground">
                  Hi, <span className="font-semibold text-foreground">{teacher.fullName}</span>
                </span>
                {teacher.role === 'ADMIN' && (
                  <Button
                    size="sm"
                    variant={view === 'admin-manage' ? 'default' : 'outline'}
                    onClick={() => setView('admin-manage')}
                    className="px-2 sm:px-3"
                  >
                    <Shield className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={view === 'teacher-dash' ? 'default' : 'outline'}
                  onClick={() => setView('teacher-dash')}
                  className="px-2 sm:px-3"
                >
                  <School className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">My Classes</span>
                  <span className="sm:hidden">Classes</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={handleLogout} className="px-2 sm:px-3">
                  <LogOut className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setView('student-check')} className="px-2 sm:px-3">
                <Eye className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Check Result</span>
                <span className="sm:hidden">Result</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {view === 'home' && (
          <HomeView
            onCheckResult={() => setView('student-check')}
            onLogoClick={handleLogoClick}
            logoClicks={logoClicks}
            teacher={teacher}
            onGoToDash={() => setView(teacher?.role === 'ADMIN' ? 'admin-manage' : 'teacher-dash')}
          />
        )}

        {view === 'student-check' && (
          <StudentCheckView
            onBack={() => setView('home')}
            onViewResult={(data) => {
              setStudentResultData(data);
              setView('student-result');
            }}
          />
        )}

        {view === 'student-result' && studentResultData && (
          <StudentResultView
            data={studentResultData}
            onBack={() => setView('student-check')}
          />
        )}

        {view === 'teacher-login' && (
          <TeacherLoginView
            onBack={() => setView('home')}
            onGoSignup={() => setView('teacher-signup')}
            onSuccess={(t) => {
              setTeacher(t);
              setView(t.role === 'ADMIN' ? 'admin-manage' : 'teacher-dash');
            }}
          />
        )}

        {view === 'teacher-signup' && (
          <TeacherSignupView
            onBack={() => setView('teacher-login')}
            onSignupSuccess={() => setView('teacher-login')}
          />
        )}

        {view === 'teacher-dash' && teacher && (
          <TeacherDashView
            teacher={teacher}
            classes={classes}
            onOpenClass={(c) => {
              setSelectedClass(c);
              setView('teacher-students');
            }}
            onGoAdmin={() => setView('admin-manage')}
          />
        )}

        {view === 'teacher-students' && selectedClass && (
          <TeacherStudentsView
            cls={selectedClass}
            students={students}
            term={selectedTerm}
            session={selectedSession}
            onTermChange={setSelectedTerm}
            onSessionChange={setSelectedSession}
            onBack={() => setView('teacher-dash')}
            onOpenStudent={(s) => {
              setSelectedStudent(s);
              setView('teacher-edit');
            }}
          />
        )}

        {view === 'teacher-edit' && selectedStudent && selectedClass && (
          <TeacherEditForm
            student={selectedStudent}
            cls={selectedClass}
            term={selectedTerm}
            session={selectedSession}
            teacher={teacher!}
            onBack={() => {
              setView('teacher-students');
              // refresh students list
              if (selectedClass) {
                fetch(`/api/teacher/students?classId=${selectedClass.id}`)
                  .then((r) => r.json())
                  .then((d) => setStudents(d.students || []));
              }
            }}
            onViewResult={(data) => {
              setStudentResultData(data);
              setView('student-result');
            }}
          />
        )}

        {view === 'admin-manage' && teacher && teacher.role === 'ADMIN' && (
          <AdminPanel
            teacher={teacher}
            classes={classes}
            refreshClasses={() => {
              fetch('/api/teacher/classes')
                .then((r) => r.json())
                .then((d) => setClasses(d.classes || []));
            }}
          />
        )}
      </main>

      <footer className="no-print mt-auto bg-ggsa-purple text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <div className="font-semibold mb-1">GOD GENERALS STANDARD ACADEMY</div>
          <div className="text-purple-200 text-xs">
            6, Victory Avenue, Off Ikare/Akungba Road, Oke-Igbede, Ikare Akoko, Ondo State
          </div>
          <div className="text-purple-200 text-xs mt-1">
            Tel: 08134033219, 08063681454 • Email: godgenerals1@gmail.com
          </div>
          <div className="text-purple-300 text-xs mt-3 italic">
            For Development & Academic Excellence
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// HOME VIEW
// ============================================================
function HomeView({
  onCheckResult,
  onLogoClick,
  logoClicks,
  teacher,
  onGoToDash,
}: {
  onCheckResult: () => void;
  onLogoClick: () => void;
  logoClicks: number;
  teacher: Teacher | null;
  onGoToDash: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-amber-800 text-white p-5 sm:p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white_2px,transparent_2px)] [background-size:24px_24px]" />
        <div className="relative grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
          <div>
            <Badge className="bg-amber-400 text-purple-900 hover:bg-amber-400 mb-3">
              Result Portal
            </Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">
              God Generals<br />Standard Academy
            </h1>
            <p className="text-purple-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-5 max-w-md">
              Check your term results online with the PIN your teacher gives you.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button size="sm" onClick={onCheckResult} className="bg-amber-400 text-purple-900 hover:bg-amber-300 sm:text-base sm:py-2 sm:px-4">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Check Result</span>
              </Button>
              {teacher && (
                <Button size="sm" variant="outline" onClick={onGoToDash} className="bg-white/10 border-white/30 text-white hover:bg-white/20 sm:text-base sm:py-2 sm:px-4">
                  <School className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">Teacher Dashboard</span>
                </Button>
              )}
            </div>
          </div>

          {/* The clickable logo — click 3x to reveal teacher login */}
          <div className="flex justify-center md:justify-end">
            <button
              onClick={onLogoClick}
              className="group relative"
              aria-label="School logo"
              title="School logo"
            >
              <div className="absolute -inset-3 bg-amber-400/30 rounded-full blur-2xl group-hover:bg-amber-400/50 transition" />
              <img
                src="/logo-transparent.png"
                alt="God Generals Standard Academy logo"
                className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[32rem] lg:h-[32rem] object-contain drop-shadow-2xl group-hover:scale-105 transition"
                style={{ backgroundColor: 'transparent' }}
                draggable={false}
              />
              {logoClicks > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-white/20 px-2 py-0.5 rounded-full backdrop-blur">
                  {logoClicks}/3
                </div>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-purple-100">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-ggsa-purple flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">For Students</CardTitle>
            <CardDescription>
              Check your result anywhere with the unique PIN your teacher gives you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={onCheckResult}>
              Check My Result <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Printable Result</CardTitle>
            <CardDescription>
              Same structure as the paper report card — download or print.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Once a result is finalized, students can view and download a printable copy.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* School info section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-ggsa-cream border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-ggsa-gold" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            6, Victory Avenue, Off Ikare/Akungba Road, Adjacent New Garage, Oke-Igbede, Ikare Akoko, Ondo State
          </CardContent>
        </Card>
        <Card className="bg-ggsa-cream border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-ggsa-gold" /> Telephone
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            08134033219, 08063681454
          </CardContent>
        </Card>
        <Card className="bg-ggsa-cream border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-ggsa-gold" /> Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            godgenerals1@gmail.com
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ============================================================
// STUDENT CHECK VIEW (PIN-based result check)
// ============================================================
function StudentCheckView({
  onBack,
  onViewResult,
}: {
  onBack: () => void;
  onViewResult: (data: StudentResultData) => void;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/student/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: data.error || 'Failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Result loaded successfully' });
      onViewResult(data);
    } catch (err) {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
      </Button>
      <Card className="border-purple-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-t-lg">
          <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Lock className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl">Check Your Result</CardTitle>
          <CardDescription className="text-purple-100">
            Enter the PIN your teacher gave you to view your result.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Result PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="text-center text-2xl tracking-[0.4em] font-bold"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Each result has its own unique PIN. Different terms have different PINs.
              </p>
            </div>
            <Button type="submit" className="w-full bg-ggsa-purple hover:bg-purple-800" disabled={loading || pin.length < 4}>
              {loading ? 'Loading...' : (<><Search className="w-4 h-4 mr-2" /> View Result</>)}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Demo: enter PIN <strong>1234</strong> to view a sample result.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// STUDENT RESULT VIEW (with download/print)
// ============================================================
function StudentResultView({
  data,
  onBack,
}: {
  data: StudentResultData;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button onClick={() => window.print()} className="bg-ggsa-purple hover:bg-purple-800">
          <Download className="w-4 h-4 mr-2" /> Download / Print Result
        </Button>
      </div>
      <ResultSheet data={data} />
    </div>
  );
}

// ============================================================
// TEACHER LOGIN VIEW
// ============================================================
function TeacherLoginView({
  onBack,
  onGoSignup,
  onSuccess,
}: {
  onBack: () => void;
  onGoSignup: () => void;
  onSuccess: (t: Teacher) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: data.error || 'Login failed', variant: 'destructive' });
        return;
      }
      toast({ title: `Welcome, ${data.fullName}` });
      onSuccess(data);
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
      </Button>
      <Card className="border-purple-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-t-lg">
          <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <LogIn className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl">Teacher Login</CardTitle>
          <CardDescription className="text-purple-100">
            Sign in to manage your students' results.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">Username</Label>
              <Input
                id="u"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Password</Label>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full bg-ggsa-purple hover:bg-purple-800" disabled={loading}>
              {loading ? 'Signing in...' : (<><LogIn className="w-4 h-4 mr-2" /> Sign In</>)}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onGoSignup}
              className="font-semibold text-ggsa-purple hover:underline"
            >
              Sign up
            </button>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            New signups require admin approval. After you sign up, the school administrator must approve your account before you can log in.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TEACHER SIGNUP VIEW
// ============================================================
function TeacherSignupView({
  onBack,
  onSignupSuccess,
}: {
  onBack: () => void;
  onSignupSuccess: () => void;
}) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      toast({
        title: 'Invalid username',
        description: 'Username must be 3-30 characters: letters, numbers, or underscores only.',
        variant: 'destructive',
      });
      return;
    }
    if (fullName.trim().length < 3) {
      toast({
        title: 'Name too short',
        description: 'Please enter your full name (at least 3 characters).',
        variant: 'destructive',
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both password fields are identical.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullName, email, subject }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: data.error || 'Signup failed', variant: 'destructive' });
        return;
      }
      toast({
        title: 'Signup received!',
        description: 'Your account is now awaiting admin approval. You will be able to log in once the administrator approves your request.',
        duration: 10000,
      });
      onSignupSuccess();
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
      </Button>
      <Card className="border-purple-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-t-lg">
          <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <UserPlus className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl">Teacher Sign Up</CardTitle>
          <CardDescription className="text-purple-100">
            Request a teacher account. The admin will approve your signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="su-fullname">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="su-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Mr. Samuel Ariyo"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="su-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3-30 chars: letters, numbers, underscores"
                required
                autoComplete="username"
                pattern="[a-zA-Z0-9_]{3,30}"
              />
              <p className="text-[11px] text-muted-foreground">
                3-30 characters: letters, numbers, or underscores only.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="su-email">Email (optional)</Label>
                <Input
                  id="su-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-subject">Subject (optional)</Label>
                <Input
                  id="su-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="su-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-confirm">Confirm Password <span className="text-destructive">*</span></Label>
              <Input
                id="su-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                minLength={6}
                className={confirmPassword && confirmPassword !== password ? 'border-destructive' : ''}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-destructive">Passwords do not match.</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-[11px] text-green-600">Passwords match.</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-ggsa-purple hover:bg-purple-800" disabled={loading}>
              {loading ? 'Submitting...' : (<><UserPlus className="w-4 h-4 mr-2" /> Request Account</>)}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            After submitting, your request will be reviewed by the school administrator. You cannot log in until your account is approved.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TEACHER DASHBOARD VIEW
// ============================================================
function TeacherDashView({
  teacher,
  classes,
  onOpenClass,
  onGoAdmin,
}: {
  teacher: Teacher;
  classes: SchoolClass[];
  onOpenClass: (c: SchoolClass) => void;
  onGoAdmin: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ggsa-purple">
            Welcome, {teacher.fullName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {teacher.subject ? `Subject: ${teacher.subject}` : 'School Administrator'}
            {' • '}
            {teacher.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
          </p>
        </div>
        {teacher.role === 'ADMIN' && (
          <Button variant="outline" onClick={onGoAdmin} size="sm" className="sm:size-default">
            <Shield className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Admin Panel</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-ggsa-purple" /> Your Classes
          </CardTitle>
          <CardDescription>
            Select a class to view its students and edit their results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No classes assigned to you yet. {teacher.role === 'ADMIN' && 'Use the Admin Panel to assign yourself to classes.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpenClass(c)}
                  className="text-left p-4 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 hover:border-purple-300 transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-lg text-ggsa-purple">{c.name}</div>
                    <Badge variant="outline" className="text-xs">{c.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {c.studentCount} student{c.studentCount === 1 ? '' : 's'}
                  </div>
                  {c.subject && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Your subject: {c.subject}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-ggsa-purple font-medium flex items-center">
                    Open class <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TEACHER STUDENTS VIEW
// ============================================================
function TeacherStudentsView({
  cls,
  students,
  term,
  session,
  onTermChange,
  onSessionChange,
  onBack,
  onOpenStudent,
}: {
  cls: SchoolClass;
  students: StudentListItem[];
  term: string;
  session: string;
  onTermChange: (v: string) => void;
  onSessionChange: (v: string) => void;
  onBack: () => void;
  onOpenStudent: (s: StudentListItem) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Classes
        </Button>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <Label className="text-xs">Term</Label>
            <Select value={term} onValueChange={onTermChange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Term">1st Term</SelectItem>
                <SelectItem value="2nd Term">2nd Term</SelectItem>
                <SelectItem value="3rd Term">3rd Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Session</Label>
            <Input
              value={session}
              onChange={(e) => onSessionChange(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ggsa-purple" /> {cls.name} — Students
          </CardTitle>
          <CardDescription>
            Click a student to input or edit their result for <strong>{term}, {session}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students in this class yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {students.map((s) => {
                const isFinalized = s.latestResult?.status === 'FINALIZED' &&
                  s.latestResult?.term === term &&
                  s.latestResult?.session === session;
                const hasDraft = s.latestResult?.status === 'DRAFT' &&
                  s.latestResult?.term === term &&
                  s.latestResult?.session === session;
                return (
                  <button
                    key={s.id}
                    onClick={() => onOpenStudent(s)}
                    className="text-left p-3 rounded-lg border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      s.sex === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.admissionNumber || 'No admission number'}
                      </div>
                    </div>
                    {isFinalized && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Final
                      </Badge>
                    )}
                    {hasDraft && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        Draft
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
