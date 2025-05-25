"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Save, X, ArrowLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqData {
  drivinglessons: FaqItem[];
  advancedDrivingImprovementCourse: FaqItem[];
}

const fetchFaq = async (): Promise<FaqData> => {
  const res = await fetch("/api/faq");
  return res.json();
};

const updateFaq = async (data: FaqData) => {
  await fetch("/api/faq", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

function extractFirstLink(html: string): string | null {
  const match = html.match(/href=["']([^"']+)["']/);
  return match ? match[1] : null;
}

// Utilidad para mostrar notificaciones
function showToast(msg: string) {
  if (typeof window !== "undefined" && typeof (window as unknown as { toast?: { success: (msg: string) => void } }).toast !== 'undefined') {
    (window as unknown as { toast: { success: (msg: string) => void } }).toast.success(msg);
  } else {
    alert(msg);
  }
}

export default function FaqAdminPage() {
  const [faq, setFaq] = useState<FaqData | null>(null);
  const [editIndex, setEditIndex] = useState<{ section: string; idx: number } | null>(null);
  const [editItem, setEditItem] = useState<FaqItem>({ question: "", answer: "" });
  const [addSection, setAddSection] = useState<string | null>(null);
  const [addItem, setAddItem] = useState<FaqItem>({ question: "", answer: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaq().then(data => {
      console.log('FAQ DATA:', data); // DEBUG: Ver qué llega realmente
      setFaq(data);
    });
  }, []);

  const handleEdit = (section: string, idx: number) => {
    setEditIndex({ section, idx });
    setEditItem(faq![section as keyof FaqData][idx]);
  };

  const handleEditSave = async () => {
    if (!faq || !editIndex) return;
    const updated = { ...faq };
    updated[editIndex.section as keyof FaqData][editIndex.idx] = editItem;
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setEditIndex(null);
    setLoading(false);
    showToast("Question updated in database!");
  };

  const handleDelete = async (section: string, idx: number) => {
    if (!faq) return;
    const updated = { ...faq };
    updated[section as keyof FaqData] = updated[section as keyof FaqData].filter((_, i) => i !== idx);
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setLoading(false);
    showToast("Question deleted from database!");
  };

  const handleAdd = async () => {
    if (!faq || !addSection) return;
    const updated = { ...faq };
    updated[addSection as keyof FaqData] = [addItem, ...updated[addSection as keyof FaqData]];
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setAddSection(null);
    setAddItem({ question: "", answer: "" });
    setLoading(false);
    showToast("Question added to database!");
  };

  const sections = [
    {
      key: "drivinglessons",
      label: "Driving Lessons",
      color: "bg-blue-100 text-blue-800",
    },
    {
      key: "advancedDrivingImprovementCourse",
      label: "Advanced Driving Improvement Course",
      color: "bg-green-100 text-green-800",
    },
  ];

  return (
    <div className="p-8 w-full max-w-full mx-auto">
      <div className="flex items-center mb-4">
        <Link href="/console">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex-1 text-center">FAQ Admin</h1>
      </div>
      {faq ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <Card key={section.key} className="shadow-lg">
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold capitalize">{section.label}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${section.color}`}>{faq[section.key as keyof FaqData].length}</span>
                  </div>
                  {addSection === section.key ? null : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAddSection(section.key)}
                      title="Add Question"
                    >
                      <Plus />
                    </Button>
                  )}
                </div>
                {/* Add new question */}
                {addSection === section.key && (
                  <div className="mb-4 border rounded p-3 bg-gray-50">
                    <input
                      className="w-full mb-2 p-2 border rounded"
                      placeholder="Question"
                      value={addItem.question}
                      onChange={(e) => setAddItem({ ...addItem, question: e.target.value })}
                    />
                    <textarea
                      className="w-full mb-2 p-2 border rounded font-mono"
                      placeholder="Answer (HTML allowed)"
                      rows={3}
                      value={addItem.answer}
                      onChange={(e) => setAddItem({ ...addItem, answer: e.target.value })}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={handleAdd} disabled={loading || !addItem.question || !addItem.answer}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddSection(null)}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {/* Question list */}
                <div className="space-y-6 min-h-[120px]">
                  {faq[section.key as keyof FaqData].length === 0 ? (
                    <div className="text-gray-400 text-center italic py-8">No questions yet. Click + to add one.</div>
                  ) : (
                    faq[section.key as keyof FaqData].map((item, idx) => {
                      const link = extractFirstLink(item.answer);
                      return (
                        <div key={idx} className="border rounded-lg p-5 bg-gray-50 shadow-sm relative flex flex-col gap-2">
                          {editIndex && editIndex.section === section.key && editIndex.idx === idx ? (
                            <>
                              <input
                                className="w-full mb-2 p-2 border rounded"
                                value={editItem.question}
                                onChange={(e) => setEditItem({ ...editItem, question: e.target.value })}
                                placeholder="Question"
                              />
                              <textarea
                                className="w-full mb-2 p-2 border rounded font-mono"
                                rows={3}
                                value={editItem.answer}
                                onChange={(e) => setEditItem({ ...editItem, answer: e.target.value })}
                                placeholder="Answer (HTML allowed)"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={handleEditSave} disabled={loading || !editItem.question || !editItem.answer}>
                                  <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditIndex(null)}>
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold mb-1 text-base">{item.question}</div>
                              <div
                                className="prose prose-sm text-gray-700"
                                dangerouslySetInnerHTML={{ __html: item.answer }}
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleEdit(section.key, idx)} title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(section.key, idx)} title="Delete">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                                {link && (
                                  <a href={link} target="_blank" rel="noopener noreferrer" title="Go to link">
                                    <Button size="icon" variant="outline">
                                      <LinkIcon className="w-4 h-4 text-blue-600" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">Loading FAQ...</div>
      )}
    </div>
  );
}
