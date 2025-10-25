"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Save, X, ArrowLeft, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  label: string;
  questions: FaqItem[];
}

interface FaqData {
  sections: Record<string, FaqSection>;
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


export default function FaqAdminPage() {
  const [faq, setFaq] = useState<FaqData | null>(null);
  const [editIndex, setEditIndex] = useState<{ section: string; idx: number } | null>(null);
  const [editItem, setEditItem] = useState<FaqItem>({ question: "", answer: "" });
  const [addSection, setAddSection] = useState<string | null>(null);
  const [addItem, setAddItem] = useState<FaqItem>({ question: "", answer: "" });
  const [addLinkText, setAddLinkText] = useState("");
  const [addLinkUrl, setAddLinkUrl] = useState("");
  const [editLinkText, setEditLinkText] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showSuccessModal = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  useEffect(() => {
    fetchFaq().then(data => {
      //console.log('FAQ DATA:', data); // DEBUG: Ver qué llega realmente
      setFaq(data);
    });
  }, []);

  const handleEdit = (section: string, idx: number) => {
    setEditIndex({ section, idx });
    setEditItem(faq!.sections[section].questions[idx]);
    const match = faq!.sections[section].questions[idx].answer.match(/<a [^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/);
    setEditLinkUrl(match ? match[1] : "");
    setEditLinkText(match ? match[2] : "");
  };

  const handleEditSave = async () => {
    if (!faq || !editIndex) return;
    let answer = editItem.answer;
    if (!editLinkText && !editLinkUrl) {
      answer = answer.replace(/<a [^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/, "");
    } else if (editLinkText && editLinkUrl) {
      answer = answer.replace(/<a [^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/, "");
      answer = answer.trim() + ` <a href=\"${editLinkUrl}\" class=\"text-blue-600 font-semibold\" rel=\"noopener noreferrer\">${editLinkText}</a>`;
    }
    const updated = {
      sections: {
        ...faq.sections,
        [editIndex.section]: {
          ...faq.sections[editIndex.section],
          questions: faq.sections[editIndex.section].questions.map((item, idx) =>
            idx === editIndex.idx ? { ...editItem, answer } : item
          )
        }
      }
    };
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setEditIndex(null);
    setLoading(false);
    showSuccessModal("Question updated successfully!");
  };

  const handleDelete = async (section: string, idx: number) => {
    if (!faq) return;
    const updated = {
      sections: {
        ...faq.sections,
        [section]: {
          ...faq.sections[section],
          questions: faq.sections[section].questions.filter((_, i) => i !== idx)
        }
      }
    };
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setLoading(false);
    showSuccessModal("Question deleted successfully!");
  };

  const handleAdd = async () => {
    if (!faq || !addSection) return;
    let answer = addItem.answer;
    if (addLinkText && addLinkUrl) {
      answer = answer.trim() + ` <a href=\"${addLinkUrl}\" class=\"text-blue-600 font-semibold\" rel=\"noopener noreferrer\">${addLinkText}</a>`;
    }
    const updated = {
      sections: {
        ...faq.sections,
        [addSection]: {
          ...faq.sections[addSection],
          questions: [
            { ...addItem, answer },
            ...faq.sections[addSection].questions
          ]
        }
      }
    };
    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setAddSection(null);
    setAddItem({ question: "", answer: "" });
    setAddLinkText("");
    setAddLinkUrl("");
    setLoading(false);
    showSuccessModal("Question added successfully!");
  };

  const handleAddNewSection = async () => {
    if (!faq || !newSectionLabel) return;

    // Generar automáticamente el key basado en el label
    const sectionKey = newSectionLabel.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30); // Limitar longitud

    if (faq.sections[sectionKey]) {
      showSuccessModal("A section with this name already exists!");
      return;
    }

    const updated = {
      sections: {
        ...faq.sections,
        [sectionKey]: {
          label: newSectionLabel,
          questions: []
        }
      }
    };

    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setShowAddSection(false);
    setNewSectionLabel("");
    setLoading(false);
    showSuccessModal("New section created successfully!");
  };

  const handleDeleteSection = async (sectionKey: string) => {
    if (!faq) return;

    if (!confirm("Are you sure you want to delete this entire section and all its questions?")) {
      return;
    }

    const updated = {
      sections: { ...faq.sections }
    };
    delete updated.sections[sectionKey];

    setLoading(true);
    await updateFaq(updated);
    const fresh = await fetchFaq();
    setFaq(fresh);
    setLoading(false);
    showSuccessModal("Section deleted successfully!");
  };

  const getRandomColor = () => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="p-8 w-full max-w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 items-center mb-2">
        <div className="flex justify-start">
          <Link href="/console">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Console
            </Button>
          </Link>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-left md:text-center mb-4">FAQ Admin</h1>

      {/* Botón para agregar nueva sección */}
      <div className="mb-6">
        {!showAddSection ? (
          <Button onClick={() => setShowAddSection(true)} className="mb-4">
            <Plus className="w-4 h-4 mr-2" /> Add New Section
          </Button>
        ) : (
          <Card className="p-4 mb-4 bg-gray-50">
            <div className="space-y-3">
              <input
                className="w-full p-2 border rounded"
                placeholder="Section name (e.g., 'Motorcycle Lessons', 'Safety Rules')"
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddNewSection}
                  disabled={loading || !newSectionLabel}
                >
                  <Save className="w-4 h-4 mr-1" /> Create Section
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddSection(false);
                    setNewSectionLabel("");
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {faq ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(faq.sections).map(([sectionKey, section]) => (
            <Card key={sectionKey} className="shadow-lg">
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold capitalize">{section.label}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getRandomColor()}`}>{section.questions.length}</span>
                  </div>
                  <div className="flex gap-2">
                    {addSection === sectionKey ? null : (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAddSection(sectionKey)}
                        title="Add Question"
                      >
                        <Plus />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteSection(sectionKey)}
                      title="Delete Section"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Add new question */}
                {addSection === sectionKey && (
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
                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                      <input
                        className="flex-1 p-2 border rounded"
                        placeholder="Link text (optional)"
                        value={addLinkText}
                        onChange={e => setAddLinkText(e.target.value)}
                      />
                      <input
                        className="flex-1 p-2 border rounded"
                        placeholder="Link URL (optional)"
                        value={addLinkUrl}
                        onChange={e => setAddLinkUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={handleAdd} disabled={loading || !addItem.question || !addItem.answer}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAddSection(null); setAddLinkText(""); setAddLinkUrl(""); }}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {/* Question list */}
                <div className="space-y-6 min-h-[120px]">
                  {section.questions.length === 0 ? (
                    <div className="text-gray-400 text-center italic py-8">No questions yet. Click + to add one.</div>
                  ) : (
                    section.questions.map((item, idx) => {
                      const link = extractFirstLink(item.answer);
                      return (
                        <div key={idx} className="border rounded-lg p-2 bg-gray-50 shadow-sm relative flex flex-col gap-0">
                          {/* Fila de iconos arriba */}
                          <div className="flex justify-end gap-2 mb-0">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(sectionKey, idx)} title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(sectionKey, idx)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                            {link && (
                              <a href={link} rel="noopener noreferrer" title="Go to link">
                                <Button size="icon" variant="outline">
                                  <LinkIcon className="w-4 h-4 text-blue-600" />
                                </Button>
                              </a>
                            )}
                          </div>
                          {editIndex && editIndex.section === sectionKey && editIndex.idx === idx ? (
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
                              <div className="flex flex-col md:flex-row gap-2 mb-2">
                                <input
                                  className="flex-1 p-2 border rounded"
                                  placeholder="Link text (optional)"
                                  value={editLinkText}
                                  onChange={e => setEditLinkText(e.target.value)}
                                />
                                <input
                                  className="flex-1 p-2 border rounded"
                                  placeholder="Link URL (optional)"
                                  value={editLinkUrl}
                                  onChange={e => setEditLinkUrl(e.target.value)}
                                />
                              </div>
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

      {/* Success Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Success!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              {modalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={() => setShowModal(false)} className="px-8">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
