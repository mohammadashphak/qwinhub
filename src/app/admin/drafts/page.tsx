'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed Radix UI dependencies - using custom implementation
import { Loader2, Save, Eye, Info } from 'lucide-react';

interface Draft {
  id: string;
  type: 'SHARE' | 'RESULT' | 'MONTHLY';
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftFormData {
  subject: string;
  content: string;
}

const PLACEHOLDER_INFO = {
  SHARE: {
    description: 'Email template for sharing new quizzes with participants',
    placeholders: [
      { key: 'TITLE', description: 'Quiz title' },
      { key: 'OPTIONS', description: 'Quiz options (formatted)' },
      { key: 'LINK', description: 'Quiz participation link' },
      { key: 'DEADLINE', description: 'Quiz deadline' },
    ]
  },
  RESULT: {
    description: 'Email template sent after quiz deadline with results',
    placeholders: [
      { key: 'TITLE', description: 'Quiz title' },
      { key: 'OPTIONS', description: 'Quiz options (formatted)' },
      { key: 'TOTAL_RESPONSES', description: 'Total number of responses' },
      { key: 'CORRECT_COUNT', description: 'Number of correct answers' },
      { key: 'WRONG_COUNT', description: 'Number of wrong answers' },
      { key: 'CORRECT_NAMES', description: 'Names of correct participants' },
      { key: 'WRONG_NAMES', description: 'Names of wrong participants' },
      { key: 'CORRECT_PHONES', description: 'Phone numbers of correct participants' },
      { key: 'WRONG_PHONES', description: 'Phone numbers of wrong participants' },
      { key: 'WINNER_NAME', description: 'Selected winner name' },
      { key: 'WINNER_PHONE', description: 'Selected winner phone' },
    ]
  },
  MONTHLY: {
    description: 'Email template for monthly winner announcements',
    placeholders: [
      { key: 'TITLE', description: 'Winning quiz title' },
      { key: 'OPTIONS', description: 'Winning quiz options' },
      { key: 'MONTH', description: 'Month name' },
      { key: 'YEAR', description: 'Year' },
      { key: 'TOTAL_WINNERS', description: 'Total number of winners in month' },
      { key: 'WINNER_NAMES', description: 'All winner names (comma-separated)' },
      { key: 'WINNER_PHONES', description: 'All winner phones (comma-separated)' },
      { key: 'MONTHLY_WINNER_NAME', description: 'Final monthly winner name' },
      { key: 'MONTHLY_WINNER_PHONE', description: 'Final monthly winner phone' },
    ]
  }
} as const;

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'SHARE' | 'RESULT' | 'MONTHLY'>('SHARE');
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    SHARE: true,
    RESULT: true,
    MONTHLY: true,
  });

  const [formData, setFormData] = useState<Record<string, DraftFormData>>({
    SHARE: { subject: '', content: '' },
    RESULT: { subject: '', content: '' },
    MONTHLY: { subject: '', content: '' },
  });

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/drafts');
      if (!response.ok) throw new Error('Failed to fetch drafts');

      const data = await response.json();
      const fetchedDrafts: Draft[] = data.data?.drafts || [];
      setDrafts(fetchedDrafts);

      // Populate form data with existing drafts
      const newFormData = { ...formData };
      fetchedDrafts.forEach((draft: Draft) => {
        newFormData[draft.type] = {
          subject: draft.subject,
          content: draft.content,
        };
      });
      setFormData(newFormData);
      // Set edit mode to false for templates that already have a saved draft
      setEditMode(prev => ({
        ...prev,
        SHARE: fetchedDrafts.some((d: Draft) => d.type === 'SHARE') ? false : true,
        RESULT: fetchedDrafts.some((d: Draft) => d.type === 'RESULT') ? false : true,
        MONTHLY: fetchedDrafts.some((d: Draft) => d.type === 'MONTHLY') ? false : true,
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: 'SHARE' | 'RESULT' | 'MONTHLY') => {
    try {
      setSaving(type);
      setError('');
      setSuccess('');

      const response = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: formData[type].subject,
          content: formData[type].content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save draft');
      }

      setSuccess(`${type} draft saved successfully!`);
      await fetchDrafts();
      // Return to read-only mode after successful save
      setEditMode(prev => ({ ...prev, [type]: false }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (type: string, field: keyof DraftFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const insertPlaceholder = (type: string, placeholder: string) => {
    const currentContent = formData[type]?.content || '';
    const placeholderText = `{{${placeholder}}}`;
    
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        content: currentContent + placeholderText,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Draft Management</h1>
        <p className="text-gray-600">
          Manage email templates for quiz sharing, results, and monthly winners. All three drafts must exist before creating quizzes.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          {(['SHARE', 'RESULT', 'MONTHLY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{type === 'SHARE' ? 'Share Template' : type === 'RESULT' ? 'Results Template' : 'Monthly Template'}</span>
              {drafts.find(d => d.type === type) && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-200 text-gray-800">
                  Saved
                </span>
              )}
            </button>
          ))}
        </div>

        {(['SHARE', 'RESULT', 'MONTHLY'] as const).map((type) => (
          <div key={type} className={activeTab === type ? 'block' : 'hidden'}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{type === 'SHARE' ? 'Share' : type === 'RESULT' ? 'Results' : 'Monthly'} Email Template</span>
                    </CardTitle>
                    <CardDescription>
                      {PLACEHOLDER_INFO[type].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Read-only view when not editing and a draft exists */}
                    {!editMode[type] && drafts.find(d => d.type === type) ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Email Subject</Label>
                          <div className="mt-1 p-3 border rounded bg-gray-50 text-sm">
                            {formData[type]?.subject}
                          </div>
                        </div>
                        <div>
                          <Label>Email Content</Label>
                          <pre className="mt-1 p-3 border rounded bg-gray-50 text-sm whitespace-pre-wrap">{formData[type]?.content}</pre>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" onClick={() => setEditMode(prev => ({ ...prev, [type]: true }))} className="w-full">
                            Edit {type} Template
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Editable form
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`${type}-subject`}>Email Subject</Label>
                          <Input
                            id={`${type}-subject`}
                            value={formData[type]?.subject || ''}
                            onChange={(e) => handleInputChange(type, 'subject', e.target.value)}
                            placeholder="Enter email subject..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`${type}-content`}>Email Content</Label>
                          <Textarea
                            id={`${type}-content`}
                            value={formData[type]?.content || ''}
                            onChange={(e) => handleInputChange(type, 'content', e.target.value)}
                            placeholder="Enter email content with placeholders..."
                            rows={12}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => handleSave(type)}
                            disabled={saving === type || !formData[type]?.subject || !formData[type]?.content}
                            className="w-full sm:flex-1"
                          >
                            {saving === type ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save {type} Template
                              </>
                            )}
                          </Button>
                          {drafts.find(d => d.type === type) && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                // revert form to saved values and exit edit mode
                                const existing = drafts.find(d => d.type === type);
                                if (existing) {
                                  setFormData(prev => ({
                                    ...prev,
                                    [type]: { subject: existing.subject, content: existing.content },
                                  }));
                                }
                                setEditMode(prev => ({ ...prev, [type]: false }));
                              }}
                              className="w-full sm:flex-1"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Placeholders Section */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5" />
                      <span>Available Placeholders</span>
                    </CardTitle>
                    <CardDescription>
                      Click to insert placeholders into your template
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {PLACEHOLDER_INFO[type].placeholders.map((placeholder) => (
                        <div key={placeholder.key} className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertPlaceholder(type, placeholder.key)}
                            className="w-full justify-start text-left h-auto p-3"
                          >
                            <div>
                              <div className="font-mono text-xs text-blue-600">
                                {`{{${placeholder.key}}}`}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {placeholder.description}
                              </div>
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Draft Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {(['SHARE', 'RESULT', 'MONTHLY'] as const).map((type) => {
              const draft = drafts.find(d => d.type === type);
              return (
                <div key={type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{type} Template</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      draft 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {draft ? "Ready" : "Missing"}
                    </span>
                  </div>
                  {draft ? (
                    <div className="text-sm text-gray-600">
                      <p>Last updated: {new Date(draft.updatedAt).toDateString()}</p>
                      <p>Subject: {draft.subject.substring(0, 30)}...</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">Template not created yet</p>
                  )}
                </div>
              );
            })}
          </div>
          
          {drafts.length === 3 ? (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ All email templates are ready! You can now create quizzes.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                ⚠️ All three email templates must be created before you can create quizzes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
