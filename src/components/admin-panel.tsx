'use client';

/**
 * Admin panel for managing:
 *  - Students (CRUD)
 *  - Teachers (CRUD)
 *  - Classes (CRUD)
 *  - Subjects (list + add)
 *
 * Visible only to teachers with role = ADMIN.
 */
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Pencil,
  Trash2,
  Users,
  School,
  BookOpen,
  Shield,
  Plus,
  CheckCheck,
} from 'lucide-react';

interface SchoolClass {
  id: string;
  name: string;
  category: string;
  studentCount?: number;
}

export function AdminPanel({
  teacher,
  classes,
  refreshClasses,
}: {
  teacher: any;
  classes: SchoolClass[];
  refreshClasses: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-ggsa-purple" />
        <h1 className="text-2xl font-bold text-ggsa-purple">Admin Panel</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Manage students, teachers, classes, and subjects. Changes take effect immediately.
      </p>

      <Tabs defaultValue="students">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="students"><Users className="w-4 h-4 mr-1" /> Students</TabsTrigger>
          <TabsTrigger value="teachers"><Users className="w-4 h-4 mr-1" /> Teachers</TabsTrigger>
          <TabsTrigger value="classes"><School className="w-4 h-4 mr-1" /> Classes</TabsTrigger>
          <TabsTrigger value="subjects"><BookOpen className="w-4 h-4 mr-1" /> Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <StudentsManager classes={classes} />
        </TabsContent>
        <TabsContent value="teachers" className="mt-4">
          <TeachersManager classes={classes} />
        </TabsContent>
        <TabsContent value="classes" className="mt-4">
          <ClassesManager classes={classes} refresh={refreshClasses} />
        </TabsContent>
        <TabsContent value="subjects" className="mt-4">
          <SubjectsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// STUDENTS MANAGER
// ============================================================
function StudentsManager({ classes }: { classes: SchoolClass[] }) {
  const [students, setStudents] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = filterClass === 'all' ? '/api/admin/student' : `/api/admin/student?classId=${filterClass}`;
      try {
        const r = await fetch(url);
        const d = await r.json();
        if (!cancelled) setStudents(d.students || []);
      } catch {
        if (!cancelled) setStudents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [filterClass]);

  const load = async () => {
    const url = filterClass === 'all' ? '/api/admin/student' : `/api/admin/student?classId=${filterClass}`;
    const r = await fetch(url);
    const d = await r.json();
    setStudents(d.students || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student and all their results? This cannot be undone.')) return;
    const r = await fetch(`/api/admin/student?id=${id}`, { method: 'DELETE' });
    if (r.ok) {
      toast({ title: 'Student deleted' });
      load();
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Students ({students.length})
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAdd(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Add Student
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] custom-scroll pr-3">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No students yet.</div>
          ) : (
            <div className="space-y-1">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.class?.name || '-'} • {s.sex === 'F' ? 'Female' : 'Male'}
                      {s.admissionNumber ? ` • ADM ${s.admissionNumber}` : ''}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {(showAdd || editing) && (
        <StudentDialog
          student={editing}
          classes={classes}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); load(); }}
        />
      )}
    </Card>
  );
}

function StudentDialog({
  student,
  classes,
  onClose,
  onSaved,
}: {
  student: any | null;
  classes: SchoolClass[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Class selection mode: 'preset' (using existing classes) or 'manual' (type a new name)
  const existingClassId = student?.classId || classes[0]?.id || '';
  const [classMode, setClassMode] = useState<'preset' | 'manual'>(existingClassId ? 'preset' : 'manual');
  const [manualClassName, setManualClassName] = useState('');

  const [form, setForm] = useState({
    id: student?.id || '',
    name: student?.name || '',
    // admissionNumber is no longer edited by the user; auto-generated on the server
    classId: existingClassId,
    sex: student?.sex || 'M',
    year: student?.year || '2025/2026',
    teacherId: student?.teacherId || '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (classMode === 'preset' && !form.classId) {
      toast({ title: 'Please pick a class', variant: 'destructive' });
      return;
    }
    if (classMode === 'manual' && !manualClassName.trim()) {
      toast({ title: 'Please type a class name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let finalClassId = form.classId;

      // If "Write manually" is selected, find-or-create the class first
      if (classMode === 'manual') {
        const clsRes = await fetch('/api/admin/class/find-or-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: manualClassName.trim() }),
        });
        const clsData = await clsRes.json();
        if (!clsRes.ok) {
          toast({ title: clsData.error || 'Failed to create class', variant: 'destructive' });
          setSaving(false);
          return;
        }
        finalClassId = clsData.class.id;
      }

      const method = form.id ? 'PUT' : 'POST';
      const r = await fetch('/api/admin/student', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, classId: finalClassId }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Save failed', variant: 'destructive' });
        return;
      }
      toast({
        title: form.id ? 'Student updated' : 'Student added',
        description: !form.id && d.student?.admissionNumber
          ? `Auto-generated admission number: ${d.student.admissionNumber}`
          : undefined,
        duration: 8000,
      });
      onSaved();
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Edit Student' : 'Add Student'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Adeyemi Johnson"
              autoFocus
            />
          </div>

          {/* Class: preset (JSS 1-3) or write manually */}
          <div>
            <Label>Class <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setClassMode('preset'); setForm({ ...form, classId: c.id }); }}
                  className={`px-2 py-2 rounded text-sm font-medium border transition ${
                    classMode === 'preset' && form.classId === c.id
                      ? 'bg-ggsa-purple text-white border-ggsa-purple'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setClassMode('manual'); setForm({ ...form, classId: '' }); }}
                className={`px-2 py-2 rounded text-sm font-medium border transition ${
                  classMode === 'manual'
                    ? 'bg-ggsa-purple text-white border-ggsa-purple'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
              >
                ✍️ Other
              </button>
            </div>
            {classMode === 'manual' && (
              <Input
                className="mt-2"
                value={manualClassName}
                onChange={(e) => setManualClassName(e.target.value)}
                placeholder="Type the class name (e.g., SS 1, Primary 5)"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year/Session</Label>
              <Input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2025/2026"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Admission number is auto-generated. House field is no longer collected.
            Result PINs are auto-generated when a teacher finalizes a result.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TEACHERS MANAGER
// ============================================================
function TeachersManager({ classes }: { classes: SchoolClass[] }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/admin/teacher');
        const d = await r.json();
        if (!cancelled) setTeachers(d.teachers || []);
      } catch {
        if (!cancelled) setTeachers([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    const r = await fetch('/api/admin/teacher');
    const d = await r.json();
    setTeachers(d.teachers || []);
  };

  const handleDelete = async (id: string, fullName: string) => {
    if (!confirm(`Delete teacher "${fullName}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/teacher?id=${id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Teacher deleted' }); load(); }
    else {
      const d = await r.json().catch(() => ({}));
      toast({ title: d.error || 'Delete failed', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string, action: 'APPROVE' | 'REJECT', fullName: string) => {
    const verb = action === 'APPROVE' ? 'approve' : 'reject';
    if (!confirm(`${verb.charAt(0).toUpperCase()}${verb.slice(1)} signup request from "${fullName}"?`)) return;
    const r = await fetch('/api/admin/teacher/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: id, action }),
    });
    const d = await r.json();
    if (r.ok) {
      toast({ title: d.message || 'Done' });
      load();
    } else {
      toast({ title: d.error || 'Failed', variant: 'destructive' });
    }
  };

  // Sort: PENDING first, then APPROVED, then REJECTED, then by name
  const sortedTeachers = [...teachers].sort((a, b) => {
    const order: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
    const sa = order[a.status] ?? 3;
    const sb = order[b.status] ?? 3;
    if (sa !== sb) return sa - sb;
    return a.fullName.localeCompare(b.fullName);
  });

  const pendingCount = teachers.filter((t) => t.status === 'PENDING').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Teachers ({teachers.length})
            {pendingCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Add Teacher
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] custom-scroll pr-3">
          {teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No teachers yet.</div>
          ) : (
            <div className="space-y-1">
              {sortedTeachers.map((t) => {
                const isPending = t.status === 'PENDING';
                const isRejected = t.status === 'REJECTED';
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded border ${
                      isPending ? 'border-amber-300 bg-amber-50' :
                      isRejected ? 'border-red-200 bg-red-50/40 opacity-70' :
                      'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                        {t.fullName}
                        {t.role === 'ADMIN' && <Badge variant="secondary" className="text-xs">ADMIN</Badge>}
                        {isPending && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                            Pending approval
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                            Rejected
                          </Badge>
                        )}
                        {t.status === 'APPROVED' && t.role !== 'ADMIN' && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{t.username}
                        {t.email ? ` • ${t.email}` : ''}
                        {t.subject ? ` • ${t.subject}` : ''}
                        {t.status === 'APPROVED' && ` • ${t.classes?.length || 0} class(es)`}
                      </div>
                    </div>

                    {/* Approve / Reject buttons for pending teachers */}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 h-8"
                          onClick={() => handleApprove(t.id, 'APPROVE', t.fullName)}
                        >
                          <CheckCheck className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50 h-8"
                          onClick={() => handleApprove(t.id, 'REJECT', t.fullName)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {/* Edit + Delete buttons for non-admin teachers */}
                    {t.role !== 'ADMIN' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id, t.fullName)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {(showAdd || editing) && (
        <TeacherDialog
          teacher={editing}
          classes={classes}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); load(); }}
        />
      )}
    </Card>
  );
}

function TeacherDialog({
  teacher,
  classes,
  onClose,
  onSaved,
}: {
  teacher: any | null;
  classes: SchoolClass[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    id: teacher?.id || '',
    username: teacher?.username || '',
    password: '',
    fullName: teacher?.fullName || '',
    email: teacher?.email || '',
    subject: teacher?.subject || '',
    role: teacher?.role || 'TEACHER',
    classIds: (teacher?.classes || []).map((c: any) => c.classId || c.class?.id),
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleClass = (cid: string) => {
    const has = form.classIds.includes(cid);
    setForm({
      ...form,
      classIds: has ? form.classIds.filter((x: string) => x !== cid) : [...form.classIds, cid],
    });
  };

  const save = async () => {
    if (!form.username || !form.fullName || (!form.id && !form.password)) {
      toast({ title: 'Username, full name, and password are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/teacher', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Save failed', variant: 'destructive' });
        return;
      }
      toast({ title: form.id ? 'Teacher updated' : 'Teacher added' });
      onSaved();
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label>{form.id ? 'New Password (blank = keep)' : 'Password'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Email (optional)</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Subject (optional)</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned Classes</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClass(c.id)}
                  className={`px-2 py-1 rounded text-xs border ${
                    form.classIds.includes(c.id)
                      ? 'bg-ggsa-purple text-white border-ggsa-purple'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// CLASSES MANAGER
// ============================================================
function ClassesManager({ classes, refresh }: { classes: SchoolClass[]; refresh: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('JUNIOR');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const add = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const r = await fetch('/api/admin/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      const d = await r.json();
      if (!r.ok) { toast({ title: d.error || 'Failed', variant: 'destructive' }); return; }
      toast({ title: 'Class added' });
      setName('');
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this class and all its students/results?')) return;
    const r = await fetch(`/api/admin/class?id=${id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Class deleted' }); refresh(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="w-5 h-5" /> Classes ({classes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">New Class Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., JSS 1" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="JUNIOR">Junior</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} disabled={saving}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {classes.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded border border-gray-200">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.category} • {c.studentCount || 0} students
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(c.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SUBJECTS MANAGER
// ============================================================
function SubjectsManager() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('BOTH');
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/admin/subject');
        const d = await r.json();
        if (!cancelled) setSubjects(d.subjects || []);
      } catch {
        if (!cancelled) setSubjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    const r = await fetch('/api/admin/subject');
    const d = await r.json();
    setSubjects(d.subjects || []);
  };

  const add = async () => {
    if (!name || !code) return;
    const r = await fetch('/api/admin/subject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code: code.toUpperCase(), category }),
    });
    const d = await r.json();
    if (!r.ok) { toast({ title: d.error || 'Failed', variant: 'destructive' }); return; }
    toast({ title: 'Subject added' });
    setName(''); setCode('');
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    const r = await fetch(`/api/admin/subject?id=${id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Subject deleted' }); load(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Subjects ({subjects.length})
        </CardTitle>
        <CardDescription>Default subjects are pre-loaded. Add more as needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Subject Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Further Maths" />
          </div>
          <div>
            <Label className="text-xs">Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FM" className="w-24" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BOTH">Both</SelectItem>
                <SelectItem value="JUNIOR">Junior</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded border border-gray-200 text-sm">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.code} • {s.category}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
