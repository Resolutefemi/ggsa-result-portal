'use client';

/**
 * Printable result sheet that mirrors the paper report card.
 *
 * Differences from the paper template (per user requirements):
 *   - "DUPLICATE" word is REMOVED
 *   - "Sign" column is REMOVED (principal signature is auto-shown, teacher signature is text/name)
 *   - All "____________" placeholders replaced with real data
 *   - "Term" field shows the current term (user said the covered "Position" at top-LHS is the term)
 */
import React from 'react';
import Image from 'next/image';
import { SCHOOL_INFO, GRADE_SCALE } from '@/lib/constants';

export interface ResultSheetData {
  student: {
    name: string;
    admissionNumber?: string | null;
    sex: string;
    house?: string | null;
    year: string | null;
    className: string;
  };
  result: {
    id: string;
    term: string;
    session: string;
    status: string;
    schoolOpened: number;
    timesSchoolOpened: number;
    marksObtainable: number;
    teacherReport: string | null;
    principalReport: string | null;
    teacherSignature: string | null; // teacher name (text)
    nextTermBegins: string | null;
  };
  // Uploaded signature images (base64 data URLs) — snapped on the website
  teacherSignatureImage?: string | null;
  principalSignatureImage?: string | null;
  items: Array<{
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
  }>;
  traits: Array<{
    id?: string | null;
    section: string;
    name: string;
    rating: string | null;
  }>;
}

function ordinal(n: number | null): string {
  if (n == null) return '-';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ResultSheet({ data }: { data: ResultSheetData }) {
  const { student, result, items, traits, teacherSignatureImage, principalSignatureImage } = data;

  const skillTraits = traits.filter((t) => t.section === 'SKILL');
  const behaviourTraits = traits.filter((t) => t.section === 'BEHAVIOUR');

  // === Pre-group items into standalone subjects and parent groups ===
  // This produces a clean list of "render units" that the tbody maps over.
  type StandaloneUnit = { type: 'standalone'; item: typeof items[0] };
  type GroupUnit = {
    type: 'group';
    parent: typeof items[0];
    children: typeof items[];
  };
  type Unit = StandaloneUnit | GroupUnit;

  const units: Unit[] = [];
  const usedCodes = new Set<string>();

  items.forEach((item) => {
    if (usedCodes.has(item.subjectCode)) return;

    if (item.isParent) {
      // Collect all children
      const children = items.filter((it) => it.parentCode === item.subjectCode);
      units.push({ type: 'group', parent: item, children });
      usedCodes.add(item.subjectCode);
      children.forEach((c) => usedCodes.add(c.subjectCode));
    } else if (!item.parentCode) {
      // Standalone subject
      units.push({ type: 'standalone', item });
      usedCodes.add(item.subjectCode);
    }
    // Skip child items — they're handled by their parent group
  });

  // Compute overall position (sum of totals / number of subjects)
  const totals = items.map((i) => i.totalScore).filter((t): t is number => t != null);
  const overallTotal = totals.reduce((a, b) => a + b, 0);
  const overallAvg = totals.length > 0 ? overallTotal / totals.length : 0;

  // Class info
  const numInClass = items.length > 0 ? '(see position)' : '';

  return (
    <div className="result-sheet bg-white text-black mx-auto w-full shadow-xl border border-gray-200 print:shadow-none print:border-0" style={{ maxWidth: 'none' }}>
      {/* === HEADER (school name + logo + address) — condensed === */}
      <div className="flex items-center gap-3 px-3 py-2 border-b-2 border-black">
        <div className="w-[90px] h-[90px] flex-shrink-0 flex items-center justify-center">
          <img
            src="/logo-transparent.png"
            alt="GGSA Logo"
            className="w-full h-full object-contain"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-ggsa-purple uppercase whitespace-nowrap" style={{ margin: 0 }}>
            {SCHOOL_INFO.name}
          </h1>
          <p className="text-[10px] text-gray-700" style={{ margin: 0 }}>
            {SCHOOL_INFO.address}
          </p>
          <p className="text-[10px] text-gray-700" style={{ margin: 0 }}>
            Tel: {SCHOOL_INFO.phones} • E-mail: {SCHOOL_INFO.email}
          </p>
          <h2 className="text-sm font-bold text-ggsa-purple" style={{ margin: 0 }}>
            REPORT CARD FOR {student.className.startsWith('SS') ? 'SENIOR' : 'JUNIOR'} SECONDARY SCHOOL
          </h2>
        </div>
        <div className="w-16 flex-shrink-0 hidden sm:block">
          <div className="text-[9px] text-center italic text-ggsa-gold font-semibold bg-ggsa-purple rounded px-1 py-0.5">
            {SCHOOL_INFO.motto}
          </div>
        </div>
      </div>

      {/* === STUDENT INFO BAR === */}
      <div className="student-info-bar grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 p-3 text-[11px] sm:text-xs border-b border-gray-300">
        <div><span className="font-semibold">Name:</span> {student.name || '-'}</div>
        <div><span className="font-semibold">Class:</span> {student.className}</div>
        {student.admissionNumber && (
          <div><span className="font-semibold">Admission No:</span> {student.admissionNumber}</div>
        )}
        <div><span className="font-semibold">Year:</span> {result.session}</div>
        <div><span className="font-semibold">Sex:</span> {student.sex === 'F' ? 'Female' : 'Male'}</div>
        <div><span className="font-semibold">Term:</span> {result.term}</div>
        <div><span className="font-semibold">No. in Class:</span> —</div>
        <div><span className="font-semibold">No. of Times School Opened:</span> {result.timesSchoolOpened || '-'}</div>
        <div><span className="font-semibold">No. of Attendance:</span> {result.schoolOpened || '-'}</div>
        <div><span className="font-semibold">Marks Obtainable:</span> {result.marksObtainable || 100}</div>
        <div>
          <span className="font-semibold">Overall Average:</span>{' '}
          {overallAvg ? overallAvg.toFixed(1) + '%' : '-'}
        </div>
      </div>

      {/* === SUBJECTS TABLE — static A4 print-ready, fixed layout === */}
      <div className="result-table-wrap" style={{ overflowX: 'hidden', width: '100%' }}>
        <table className="result-table w-full border-collapse border border-black" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            {/* Category column ~6% */}
            <col style={{ width: '6%' }} />
            {/* Subject column ~18% */}
            <col style={{ width: '18%' }} />
            {/* 12 score columns — fixed equal width */}
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '6.3%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <thead>
            <tr className="bg-white text-black font-bold">
              <th rowSpan={2} className="border border-black px-1 py-1 text-center text-[10px]">CAT</th>
              <th rowSpan={2} className="border border-black px-2 py-1 text-left text-[10px]">SUBJECT</th>
              <th className="border border-black px-1 py-1 text-[10px]">Test 1</th>
              <th className="border border-black px-1 py-1 text-[10px]">Test 2</th>
              <th className="border border-black px-1 py-1 text-[10px]">Term Exam</th>
              <th className="border border-black px-1 py-1 text-[10px]">Total</th>
              <th className="border border-black px-1 py-1 text-[10px]">1st Term</th>
              <th className="border border-black px-1 py-1 text-[10px]">2nd Term</th>
              <th className="border border-black px-1 py-1 text-[10px]">3rd Term</th>
              <th className="border border-black px-1 py-1 text-[10px]">Total Score</th>
              <th className="border border-black px-1 py-1 text-[10px]">Graded</th>
              <th className="border border-black px-1 py-1 text-[10px]">Class Avg</th>
              <th className="border border-black px-1 py-1 text-[10px]">Position</th>
              <th className="border border-black px-1 py-1 text-[10px]">Grade</th>
              <th className="border border-black px-1 py-1 text-[10px]">Remark</th>
            </tr>
            <tr className="bg-gray-100 text-gray-700 font-semibold text-[9px]">
              <th className="border border-black px-1 py-0.5">20</th>
              <th className="border border-black px-1 py-0.5">20</th>
              <th className="border border-black px-1 py-0.5">60</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">100</th>
              <th className="border border-black px-1 py-0.5">-</th>
              <th className="border border-black px-1 py-0.5">-</th>
              <th className="border border-black px-1 py-0.5">-</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 && (
              <tr>
                <td colSpan={15} className="border border-black p-4 text-center text-gray-500">
                  No subjects recorded.
                </td>
              </tr>
            )}
            {units.map((unit, uIdx) => {
              if (unit.type === 'standalone') {
                // === Standalone subject: category cell empty + name + scores ===
                const item = unit.item;
                return (
                  <tr key={`std-${uIdx}`} className={uIdx % 2 ? 'bg-purple-50/30' : 'bg-white'}>
                    <td className="border border-black px-1 py-1 text-center text-[10px] text-gray-400">—</td>
                    <td className="border border-black px-2 py-1 font-medium text-[10px]">
                      {item.subjectName}
                    </td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.test1)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.test2)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.exam)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{fmt(item.totalScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.firstTermScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.secondTermScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.thirdTermScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{fmt(item.totalScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.totalScore)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{fmt(item.classAverage)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px]">{ordinal(item.position)}</td>
                    <td className="border border-black px-1 py-1 text-center text-[10px] font-bold">{item.grade || '-'}</td>
                    <td className="border border-black px-1 py-1 text-center text-[9px]">{item.remark || ''}</td>
                  </tr>
                );
              }

              // === Grouped subject: vertical category (rowspan) + children + ONE set of scores (rowspan) ===
              const { parent, children } = unit;
              const rs = children.length || 1;
              const allChildren = children.length > 0 ? children : [{ subjectName: '' } as any];
              const lastChildIdx = allChildren.length - 1;

              return (
                <React.Fragment key={`grp-${uIdx}`}>
                  {/* First row: vertical category (rowspan) + first child name + all score cells (rowspan) */}
                  <tr className="bg-gray-50">
                    <td rowSpan={rs} className="category-cell border border-black align-middle bg-gray-200" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center', whiteSpace: 'nowrap', padding: '10px', fontWeight: 'bold', borderRight: '2px solid black' }}>
                      {parent.subjectName}
                    </td>
                    <td className="border border-black px-2 py-1 italic text-gray-700 text-[10px]">
                      {allChildren[0].subjectName}
                    </td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.test1)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.test2)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.exam)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{fmt(parent.totalScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.firstTermScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.secondTermScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.thirdTermScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px] font-semibold">{fmt(parent.totalScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.totalScore)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{fmt(parent.classAverage)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px]">{ordinal(parent.position)}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[10px] font-bold">{parent.grade || '-'}</td>
                    <td rowSpan={rs} className="border border-black px-1 py-1 text-center text-[9px]">{parent.remark || ''}</td>
                  </tr>
                  {/* Remaining child rows: just the child name */}
                  {allChildren.slice(1).map((child, cIdx) => (
                    <tr key={`child-${uIdx}-${cIdx}`} className={`bg-white ${cIdx === lastChildIdx - 1 ? 'group-end' : ''}`}>
                      <td className="border border-black px-2 py-1 italic text-gray-700 text-[10px]">
                        {child.subjectName}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* === CHARACTER / BEHAVIOUR === */}
      <div className="grid grid-cols-2 gap-2 mt-2 px-2 text-xs sm:text-xs">
        <div className="border border-gray-400 rounded">
          <div className="bg-black text-white px-2 py-0.5 font-semibold">DEVELOPMENT (Skills)</div>
          <div className="grid grid-cols-2 gap-x-2 p-1">
            {skillTraits.map((t) => (
              <div key={t.name} className="flex justify-between">
                <span>{t.name}</span>
                <span className="font-bold">{t.rating || '-'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-gray-400 rounded">
          <div className="bg-black text-white px-2 py-0.5 font-semibold">BEHAVIOUR</div>
          <div className="grid grid-cols-2 gap-x-2 p-1">
            {behaviourTraits.map((t) => (
              <div key={t.name} className="flex justify-between">
                <span>{t.name}</span>
                <span className="font-bold">{t.rating || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === REPORTS === */}
      <div className="grid sm:grid-cols-2 gap-2 mt-2 px-2 text-[11px]">
        <div className="border border-gray-400 rounded p-2 min-h-[60px]">
          <div className="font-semibold text-ggsa-purple mb-1">Class Teacher's Report:</div>
          <div className="text-gray-800">
            {result.teacherReport || '(No teacher report yet.)'}
          </div>
        </div>
        <div className="border border-gray-400 rounded p-2 min-h-[60px]">
          <div className="font-semibold text-ggsa-purple mb-1">Principal's Report:</div>
          <div className="text-gray-800">
            {result.principalReport || '(No principal report yet.)'}
          </div>
        </div>
      </div>

      {/* === SIGNATURES === */}
      <div className="signature-section grid grid-cols-2 gap-4 mt-4 px-4 pb-3 text-[11px]">
        <div className="text-center">
          {/* Teacher's signature (uploaded image) */}
          {teacherSignatureImage ? (
            <div className="h-16 flex items-end justify-center mb-1">
              <img
                src={teacherSignatureImage}
                alt="Teacher signature"
                className="max-h-16 max-w-[180px] object-contain"
              />
            </div>
          ) : (
            <div className="h-16 mb-1" />
          )}
          <div className="border-t border-gray-700 pt-1">
            <div className="font-semibold">Class Teacher's Signature</div>
            <div className="text-gray-700">{result.teacherSignature || '(Teacher name not set)'}</div>
          </div>
        </div>
        <div className="text-center">
          {/* Principal's signature (uploaded image) */}
          {principalSignatureImage ? (
            <div className="h-16 flex items-end justify-center mb-1">
              <img
                src={principalSignatureImage}
                alt="Principal signature"
                className="max-h-16 max-w-[180px] object-contain"
              />
            </div>
          ) : (
            <div className="h-16 mb-1" />
          )}
          <div className="border-t border-gray-700 pt-1">
            <div className="font-semibold">Principal's Signature</div>
            <div className="text-gray-700 text-xs">God Generals Standard Academy</div>
          </div>
        </div>
      </div>

      {/* === GRADING KEY + NEXT TERM === */}
      <div className="grading-key grid sm:grid-cols-3 gap-2 px-2 pb-4 text-xs">
        <div className="border border-gray-400 rounded p-2 col-span-2">
          <div className="font-semibold text-ggsa-purple mb-1">KEYS TO RATING / SCORE RATING</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2">
            {GRADE_SCALE.map((g) => (
              <div key={g.grade}>
                <span className="font-bold">{g.grade}</span> = {g.remark} ({g.min}{g.max < 100 ? `-${g.max}` : '+'})
              </div>
            ))}
          </div>
        </div>
        <div className="border border-gray-400 rounded p-2">
          <div className="font-semibold text-ggsa-purple">Next Term Begins:</div>
          <div className="text-gray-800">{result.nextTermBegins || '(To be announced)'}</div>
        </div>
      </div>

      <div className="text-center text-[11px] text-gray-500 pb-2 px-2">
        Generated by God Generals Standard Academy Result Portal • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
