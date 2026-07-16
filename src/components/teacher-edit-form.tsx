'use client';

/**
 * Teacher's result input form.
 * - Pre-filled with default subjects for the student's class
 * - Auto-calculates Total, Grade, Remark on the fly
 * - Teacher enters: scores, character traits, reports, signature, next term
 * - "Save Draft" button -> /api/teacher/result
 * - "Finalize Result" button -> /api/finalize (computes positions, class average)
 * - "View/Download Result" button -> shows printable sheet
 */
import React, { useEffect, useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade, gradeRemark, SKILL_TRAITS, BEHAVIOUR_TRAITS } from '@/lib/constants';
import { computeTotal } from '@/lib/calc';
import { ResultSheet } from './result-sheet';
import { SignatureUpload } from './signature-upload';
import {
  ArrowLeft,
  Save,
  CheckCheck,
  Eye,
  Lock,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface ItemRow {
  id: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  order: number;
  isParent?: boolean;
  parentCode?: string | null;
  test1: number | null;
  test2: number | null;
  exam: number | null;
  firstTermScore: number | null;
  secondTermScore: number | null;
  thirdTermScore: number | null;
  totalScore: number | null;
  classAverage: number | null;
  position: number | null;
  grade: string | null;
  remark: string | null;
}

interface TraitRow {
  id: string | null;
  section: string;
  name: string;
  rating: string | null;
}

interface LoadResponse {
  student: {
    id: string;
    name: string;
    admissionNumber?: string | null;
    sex: string;
    house?: string | null;
    year: string | null;
    className: string;
    classId: string;
  };
  result: {
    id: string | null;
    term: string;
    session: string;
    status: string;
    schoolOpened: number;
    timesSchoolOpened: number;
    marksObtainable: number;
    teacherReport: string;
    principalReport: string;
    teacherSignature: string;
    nextTermBegins: string;
  };
  items: ItemRow[];
  traits: TraitRow[];
  // Teacher's saved signature image (base64 data URL)
  teacherSignatureImage?: string | null;
  teacherName?: string;
}

export function TeacherEditForm({
  student,
  cls,
  term,
  session,
  teacher,
  onBack,
  onViewResult,
}: {
  student: any;
  cls: any;
  term: string;
  session: string;
  teacher: any;
  onBack: () => void;
  onViewResult: (data: any) => void;
}) {
  const [data, setData] = useState<LoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Teacher signature state
  const [teacherSignature, setTeacherSignature] = useState<string | null>(null);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/teacher/result?studentId=${student.id}&term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`
      );
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Failed to load', variant: 'destructive' });
        return;
      }
      setData(d);
      // Load teacher signature from the response
      setTeacherSignature(d.teacherSignatureImage || null);
      setSignatureSaved(!!d.teacherSignatureImage);
      setSignatureDirty(false);
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [student.id, term, session, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // === Update item field with auto-calc ===
  const updateItem = (idx: number, field: keyof ItemRow, value: string) => {
    if (!data) return;
    const items = [...data.items];
    const item = { ...items[idx] };
    const numVal = value === '' ? null : Number(value);
    (item as any)[field] = numVal;
    // Recompute total + grade + remark
    item.totalScore = computeTotal(item);
    item.grade = calculateGrade(item.totalScore);
    item.remark = gradeRemark(item.grade);

    // Auto-fill the current term's score column with the Total.
    // If filling 1st Term -> 1st Term Score = Total
    // If filling 2nd Term -> 2nd Term Score = Total
    // If filling 3rd Term -> 3rd Term Score = Total
    // (only auto-fill when the test/exam scores change, not when the
    //  teacher is manually editing a different term's column)
    const isScoreField = field === 'test1' || field === 'test2' || field === 'exam';
    if (isScoreField && item.totalScore != null) {
      if (term === '1st Term') item.firstTermScore = item.totalScore;
      else if (term === '2nd Term') item.secondTermScore = item.totalScore;
      else if (term === '3rd Term') item.thirdTermScore = item.totalScore;
    }

    items[idx] = item;
    setData({ ...data, items });
  };

  const updateTrait = (idx: number, value: string) => {
    if (!data) return;
    const traits = [...data.traits];
    traits[idx] = { ...traits[idx], rating: value || null };
    setData({ ...data, traits });
  };

  const updateResultField = (field: keyof LoadResponse['result'], value: any) => {
    if (!data) return;
    setData({ ...data, result: { ...data.result, [field]: value } });
  };

  const buildPayload = () => {
    if (!data) return null;
    return {
      studentId: student.id,
      term,
      session,
      items: data.items.map((i) => ({
        id: i.id,
        subjectId: i.subjectId,
        test1: i.test1,
        test2: i.test2,
        exam: i.exam,
        firstTermScore: i.firstTermScore,
        secondTermScore: i.secondTermScore,
        thirdTermScore: i.thirdTermScore,
      })),
      traits: data.traits.map((t) => ({
        section: t.section,
        name: t.name,
        rating: t.rating,
      })),
      schoolOpened: data.result.schoolOpened,
      timesSchoolOpened: data.result.timesSchoolOpened,
      marksObtainable: data.result.marksObtainable,
      teacherReport: data.result.teacherReport,
      principalReport: data.result.principalReport,
      teacherSignature: data.result.teacherSignature,
      nextTermBegins: data.result.nextTermBegins,
    };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/teacher/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Save failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Draft saved successfully' });
      load(); // refresh to get new IDs
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!data) return;
    if (!data.result.teacherReport || !data.result.principalReport || !data.result.teacherSignature) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in teacher report, principal report, and teacher signature before finalizing.',
        variant: 'destructive',
      });
      return;
    }
    setFinalizing(true);
    try {
      const r = await fetch('/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Finalize failed', variant: 'destructive' });
        return;
      }
      // Show the generated PIN prominently so the teacher can give it to the student
      const pin = d.pin || data.result.pin;
      toast({
        title: 'Result finalized!',
        description: pin
          ? `Student PIN: ${pin} — give this to the student so they can check their result.`
          : 'Student can now check their result.',
        duration: 12000,
      });
      await load();
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setFinalizing(false);
    }
  };

  const handleViewResult = async () => {
    // Re-load to get latest cached position/classAverage, then open preview
    await load();
    if (!data) return;
    setShowPreview(true);
  };

  // === Teacher signature handlers ===
  const handleSignatureChange = (newSig: string | null) => {
    setTeacherSignature(newSig);
    setSignatureDirty(true);
  };

  const saveSignature = async () => {
    setSavingSignature(true);
    try {
      const r = await fetch('/api/teacher/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureImage: teacherSignature }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast({ title: d.error || 'Failed to save signature', variant: 'destructive' });
        return;
      }
      toast({ title: 'Signature saved', description: 'It will appear on every result you finalize.' });
      setSignatureDirty(false);
      setSignatureSaved(true);
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setSavingSignature(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading result form...</div>;
  }
  if (!data) {
    return <div className="py-12 text-center text-destructive">Failed to load.</div>;
  }

  const isFinalized = data.result.status === 'FINALIZED';

  // === Pre-group items into standalone subjects and parent groups ===
  // Each unit tracks the original array index so updateItem(idx, ...) works.
  type ItemWithIdx = { item: typeof data.items[0]; idx: number };
  type StandaloneUnit = { type: 'standalone'; item: ItemWithIdx };
  type GroupUnit = { type: 'group'; parent: ItemWithIdx; children: ItemWithIdx[] };
  type Unit = StandaloneUnit | GroupUnit;

  const units: Unit[] = [];
  const usedIdx = new Set<number>();

  data.items.forEach((item, idx) => {
    if (usedIdx.has(idx)) return;
    if (item.isParent) {
      const children = data.items
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => it.parentCode === item.subjectCode)
        .map(({ it, i }) => ({ item: it, idx: i }));
      units.push({ type: 'group', parent: { item, idx }, children });
      usedIdx.add(idx);
      children.forEach((c) => usedIdx.add(c.idx));
    } else if (!item.parentCode) {
      units.push({ type: 'standalone', item: { item, idx } });
      usedIdx.add(idx);
    }
  });

  if (showPreview && data) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Edit
          </Button>
          <Button onClick={() => window.print()} className="bg-ggsa-purple hover:bg-purple-800">
            Print / Save as PDF
          </Button>
        </div>
        <ResultSheet
          data={{
            student: data.student,
            result: data.result as any,
            items: data.items,
            traits: data.traits,
            teacherSignatureImage: teacherSignature,
            principalSignatureImage: null, // teacher preview doesn't need principal sig
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to {cls.name}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleViewResult}>
            <Eye className="w-4 h-4 mr-1" /> View Result
          </Button>
          {!isFinalized && (
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
          {!isFinalized && (
            <Button onClick={handleFinalize} disabled={finalizing} className="bg-green-700 hover:bg-green-800">
              <CheckCheck className="w-4 h-4 mr-1" /> {finalizing ? 'Finalizing...' : 'Finalize Result'}
            </Button>
          )}
          {isFinalized && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-sm py-1.5">
              <Lock className="w-3 h-3 mr-1" /> FINALIZED
            </Badge>
          )}
        </div>
      </div>

      {/* PIN banner — shown when finalized so the teacher can give it to the student */}
      {isFinalized && data.result.pin && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-green-700 font-semibold">
                Student Result PIN
              </div>
              <div className="text-3xl font-extrabold text-green-900 tracking-[0.3em]">
                {data.result.pin}
              </div>
              <div className="text-xs text-green-700">
                Give this 6-digit PIN to <strong>{student.name}</strong> so they can check their result on the homepage.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-green-400 text-green-700 hover:bg-green-100"
            onClick={() => {
              navigator.clipboard?.writeText(data.result.pin || '');
              toast({ title: 'PIN copied to clipboard' });
            }}
          >
            Copy PIN
          </Button>
        </div>
      )}

      {/* === TEACHER SIGNATURE === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Your Signature
          </CardTitle>
          <CardDescription>
            Snap or upload your signature once. It will be automatically added to every result you finalize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureUpload
            label="Class Teacher's Signature"
            currentSignature={teacherSignature}
            onChange={handleSignatureChange}
            disabled={false}
          />
          {signatureSaved && !signatureDirty && (
            <p className="text-[11px] text-green-600 mt-2">✓ Signature saved — will appear on result sheets.</p>
          )}
          {signatureDirty && (
            <Button size="sm" className="mt-2 bg-ggsa-purple hover:bg-purple-800" onClick={saveSignature} disabled={savingSignature}>
              {savingSignature ? 'Saving...' : 'Save Signature'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>
              {student.name}
              {student.admissionNumber && (
                <span className="text-sm font-normal text-muted-foreground"> ({student.admissionNumber})</span>
              )}
            </span>
            <Badge variant="outline">{cls.name} • {term} • {session}</Badge>
          </CardTitle>
          <CardDescription>
            Enter test and exam scores. <strong>Total</strong>, <strong>Grade</strong>, and <strong>Remark</strong> are calculated automatically.
            Position and Class Average are computed when you click <strong>Finalize</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* SUBJECTS TABLE — static, fixed layout, no scroll */}
          <div className="result-table-wrap" style={{ overflowX: 'hidden', width: '100%' }}>
            <table className="result-table w-full text-xs border-collapse border border-black" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '7.4%' }} />
                <col style={{ width: '7.4%' }} />
                <col style={{ width: '7.4%' }} />
                <col style={{ width: '7.4%' }} />
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '7.4%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-black px-1 py-1 text-center text-[10px]">CAT</th>
                  <th className="border border-black px-2 py-1 text-left text-[10px]">SUBJECT</th>
                  <th className="border border-black px-1 py-1 text-[10px]">Test 1</th>
                  <th className="border border-black px-1 py-1 text-[10px]">Test 2</th>
                  <th className="border border-black px-1 py-1 text-[10px]">Exam</th>
                  <th className="border border-black px-1 py-1 bg-gray-700 text-[10px]">Total</th>
                  <th className="border border-black px-1 py-1 text-[10px]">1st Term</th>
                  <th className="border border-black px-1 py-1 text-[10px]">2nd Term</th>
                  <th className="border border-black px-1 py-1 text-[10px]">3rd Term</th>
                  <th className="border border-black px-1 py-1 bg-amber-700 text-[10px]">Grade</th>
                  <th className="border border-black px-1 py-1 text-[10px]">Remark</th>
                </tr>
                <tr className="bg-gray-100 text-gray-600 text-[9px]">
                  <th className="border border-black px-1 py-0.5">-</th>
                  <th className="border border-black px-1 py-0.5">Max: 100</th>
                  <th className="border border-black px-1 py-0.5">20</th>
                  <th className="border border-black px-1 py-0.5">20</th>
                  <th className="border border-black px-1 py-0.5">60</th>
                  <th className="border border-black px-1 py-0.5">100</th>
                  <th className="border border-black px-1 py-0.5">100</th>
                  <th className="border border-black px-1 py-0.5">100</th>
                  <th className="border border-black px-1 py-0.5">100</th>
                  <th className="border border-black px-1 py-0.5">-</th>
                  <th className="border border-black px-1 py-0.5">-</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, uIdx) => {
                  if (unit.type === 'standalone') {
                    // === Standalone subject: empty CAT + name + scores ===
                    const { item, idx } = unit.item;
                    return (
                      <tr key={`std-${uIdx}`} className={uIdx % 2 ? 'bg-purple-50/30' : ''}>
                        <td className="border border-black px-1 py-1 text-center text-[10px] text-gray-400">—</td>
                        <td className="border border-black px-2 py-1 font-medium whitespace-nowrap">{item.subjectName}</td>
                        <td className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="20" value={item.test1 ?? ''} onChange={(e) => updateItem(idx, 'test1', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="20" value={item.test2 ?? ''} onChange={(e) => updateItem(idx, 'test2', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="60" value={item.exam ?? ''} onChange={(e) => updateItem(idx, 'exam', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold bg-purple-100/40">{item.totalScore != null ? item.totalScore : '-'}</td>
                        <td className={`border border-black p-0.5 ${term === '1st Term' ? 'bg-amber-50' : ''}`}>
                          {term === '1st Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{item.firstTermScore != null ? item.firstTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={item.firstTermScore ?? ''} onChange={(e) => updateItem(idx, 'firstTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td className={`border border-black p-0.5 ${term === '2nd Term' ? 'bg-amber-50' : ''}`}>
                          {term === '2nd Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{item.secondTermScore != null ? item.secondTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={item.secondTermScore ?? ''} onChange={(e) => updateItem(idx, 'secondTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td className={`border border-black p-0.5 ${term === '3rd Term' ? 'bg-amber-50' : ''}`}>
                          {term === '3rd Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{item.thirdTermScore != null ? item.thirdTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={item.thirdTermScore ?? ''} onChange={(e) => updateItem(idx, 'thirdTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold bg-amber-100/40">{item.grade || '-'}</td>
                        <td className="border border-black px-1 py-1 text-center text-[11px]">{item.remark || ''}</td>
                      </tr>
                    );
                  }

                  // === Grouped subject: vertical category (rowspan) + children + ONE set of score inputs (rowspan) ===
                  const { parent, children } = unit;
                  const rs = children.length || 1;
                  const allChildren = children.length > 0 ? children : [{ item: { subjectName: '' } as any, idx: -1 }];
                  const pIdx = parent.idx;
                  const lastChildIdx = allChildren.length - 1;

                  return (
                    <React.Fragment key={`grp-${uIdx}`}>
                      {/* First row: vertical category (rowspan) + first child name + all score inputs (rowspan) */}
                      <tr className="bg-gray-50">
                        <td rowSpan={rs} className="category-cell border border-black align-middle bg-gray-200" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center', whiteSpace: 'nowrap', padding: '10px', fontWeight: 'bold', borderRight: '2px solid black' }}>
                          {parent.item.subjectName}
                        </td>
                        <td className="border border-black px-2 py-1 italic text-gray-600 text-xs">
                          {allChildren[0].item.subjectName}
                        </td>
                        <td rowSpan={rs} className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="20" value={parent.item.test1 ?? ''} onChange={(e) => updateItem(pIdx, 'test1', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td rowSpan={rs} className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="20" value={parent.item.test2 ?? ''} onChange={(e) => updateItem(pIdx, 'test2', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td rowSpan={rs} className="border border-black p-0.5">
                          <Input type="number" step="0.5" min="0" max="60" value={parent.item.exam ?? ''} onChange={(e) => updateItem(pIdx, 'exam', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                        </td>
                        <td rowSpan={rs} className="border border-black px-1 py-1 text-center font-bold bg-purple-100/40">{parent.item.totalScore != null ? parent.item.totalScore : '-'}</td>
                        <td rowSpan={rs} className={`border border-black p-0.5 ${term === '1st Term' ? 'bg-amber-50' : ''}`}>
                          {term === '1st Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{parent.item.firstTermScore != null ? parent.item.firstTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={parent.item.firstTermScore ?? ''} onChange={(e) => updateItem(pIdx, 'firstTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td rowSpan={rs} className={`border border-black p-0.5 ${term === '2nd Term' ? 'bg-amber-50' : ''}`}>
                          {term === '2nd Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{parent.item.secondTermScore != null ? parent.item.secondTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={parent.item.secondTermScore ?? ''} onChange={(e) => updateItem(pIdx, 'secondTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td rowSpan={rs} className={`border border-black p-0.5 ${term === '3rd Term' ? 'bg-amber-50' : ''}`}>
                          {term === '3rd Term' ? (
                            <div className="h-8 flex items-center justify-center text-xs font-bold text-amber-700">{parent.item.thirdTermScore != null ? parent.item.thirdTermScore : '-'}</div>
                          ) : (
                            <Input type="number" step="0.5" value={parent.item.thirdTermScore ?? ''} onChange={(e) => updateItem(pIdx, 'thirdTermScore', e.target.value)} disabled={isFinalized} className="h-8 text-center text-xs border-0" placeholder="-" />
                          )}
                        </td>
                        <td rowSpan={rs} className="border border-black px-1 py-1 text-center font-bold bg-amber-100/40">{parent.item.grade || '-'}</td>
                        <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[11px]">{parent.item.remark || ''}</td>
                      </tr>
                      {/* Remaining child rows: just the child name */}
                      {allChildren.slice(1).map((child, cIdx) => (
                        <tr key={`child-${uIdx}-${cIdx}`} className={`bg-white ${cIdx === lastChildIdx - 1 ? 'group-end' : ''}`}>
                          <td className="border border-black px-2 py-1 italic text-gray-600 text-xs">{child.item.subjectName}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            Total = Test 1 + Test 2 + Exam • The <strong>{term}</strong> column auto-fills with the Total.
            Enter the other terms' scores manually if needed. Grade: A(70+), B(60-69), C(50-59), D(45-49), E(40-44), F(0-39)
          </p>
        </CardContent>
      </Card>

      {/* TRAITS */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Development (Skills)</CardTitle>
            <CardDescription>Rate each trait A–E.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.traits.filter((t) => t.section === 'SKILL').map((t, idx) => {
              const realIdx = data.traits.findIndex((tt) => tt === t);
              return (
                <div key={t.name} className="flex items-center justify-between gap-2">
                  <Label className="text-sm">{t.name}</Label>
                  <select
                    value={t.rating || ''}
                    onChange={(e) => updateTrait(realIdx, e.target.value)}
                    disabled={isFinalized}
                    className="border rounded px-2 py-1 text-sm w-20"
                  >
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behaviour</CardTitle>
            <CardDescription>Rate each trait A–E.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.traits.filter((t) => t.section === 'BEHAVIOUR').map((t) => {
              const realIdx = data.traits.findIndex((tt) => tt === t);
              return (
                <div key={t.name} className="flex items-center justify-between gap-2">
                  <Label className="text-sm">{t.name}</Label>
                  <select
                    value={t.rating || ''}
                    onChange={(e) => updateTrait(realIdx, e.target.value)}
                    disabled={isFinalized}
                    className="border rounded px-2 py-1 text-sm w-20"
                  >
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ATTENDANCE + REPORTS + SIGNATURE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance, Reports & Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">No. of Times School Opened</Label>
              <Input
                type="number"
                value={data.result.timesSchoolOpened || ''}
                onChange={(e) => updateResultField('timesSchoolOpened', Number(e.target.value))}
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">No. of Attendance</Label>
              <Input
                type="number"
                value={data.result.schoolOpened || ''}
                onChange={(e) => updateResultField('schoolOpened', Number(e.target.value))}
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Marks Obtainable</Label>
              <Input
                type="number"
                value={data.result.marksObtainable || 100}
                onChange={(e) => updateResultField('marksObtainable', Number(e.target.value))}
                disabled={isFinalized}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tr">Class Teacher's Report</Label>
            <Textarea
              id="tr"
              rows={3}
              placeholder="e.g., A diligent student. More grease to your elbow."
              value={data.result.teacherReport}
              onChange={(e) => updateResultField('teacherReport', e.target.value)}
              disabled={isFinalized}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pr">Principal's Report</Label>
            <Textarea
              id="pr"
              rows={3}
              placeholder="e.g., Promoted, but more effort needed."
              value={data.result.principalReport}
              onChange={(e) => updateResultField('principalReport', e.target.value)}
              disabled={isFinalized}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ts">Teacher's Signature (Name)</Label>
              <Input
                id="ts"
                placeholder="Your name as it should appear"
                value={data.result.teacherSignature}
                onChange={(e) => updateResultField('teacherSignature', e.target.value)}
                disabled={isFinalized}
              />
              <p className="text-[11px] text-muted-foreground">
                Principal's signature is added automatically.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nt">Next Term Begins</Label>
              <Input
                id="nt"
                placeholder="e.g., 9th September, 2026"
                value={data.result.nextTermBegins}
                onChange={(e) => updateResultField('nextTermBegins', e.target.value)}
                disabled={isFinalized}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {isFinalized
                ? 'This result is finalized and visible to the student. Edit disabled.'
                : 'Remember to Save Draft often. Click Finalize when done.'}
            </p>
            {!isFinalized && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> Save Draft
                </Button>
                <Button onClick={handleFinalize} disabled={finalizing} className="bg-green-700 hover:bg-green-800">
                  <CheckCheck className="w-4 h-4 mr-1" /> Finalize
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
