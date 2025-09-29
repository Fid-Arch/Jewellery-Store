import React, { useState } from "react";
import { 
  Save, 
  Eye, 
  Send, 
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Code,
  Download,
  Upload
} from "lucide-react";

const EmailTemplateEditor = ({ template, onSave, onPreview, onSend }) => {
  const [editorContent, setEditorContent] = useState(template?.content || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [templateData, setTemplateData] = useState({
    subject: template?.subject || '',
    previewText: template?.previewText || '',
    fromName: template?.fromName || 'Goldmarks',
    fromEmail: template?.fromEmail || 'noreply@goldmarks.com',
    replyTo: template?.replyTo || 'support@goldmarks.com'
  });

  // Template variables that can be used in the content
  const templateVariables = [
    { name: 'customer_name', description: 'Customer Name', example: 'John Doe' },
    { name: 'discount_percentage', description: 'Discount Percentage', example: '20%' },
    { name: 'discount_amount', description: 'Discount Amount', example: '$50' },
    { name: 'product_name', description: 'Product Name', example: 'Diamond Ring' },
    { name: 'event_title', description: 'Event Title', example: 'Black Friday Sale' },
    { name: 'company_name', description: 'Company Name', example: 'Goldmarks' },
    { name: 'unsubscribe_link', description: 'Unsubscribe Link', example: 'https://goldmarks.com/unsubscribe' },
    { name: 'website_url', description: 'Website URL', example: 'https://goldmarks.com' }
  ];

  // Insert variable into content
  const insertVariable = (variable) => {
    const textarea = document.getElementById('email-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = `{{${variable}}}`;
    const newContent = editorContent.substring(0, start) + text + editorContent.substring(end);
    setEditorContent(newContent);
  };

  // Format text
  const formatText = (format) => {
    const textarea = document.getElementById('email-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = editorContent.substring(0, start) + formattedText + editorContent.substring(end);
    setEditorContent(newContent);
  };

  // Handle template data changes
  const handleTemplateDataChange = (e) => {
    const { name, value } = e.target;
    setTemplateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save template
  const handleSave = () => {
    const templateToSave = {
      ...templateData,
      content: editorContent,
      lastModified: new Date().toISOString()
    };
    onSave(templateToSave);
  };

  // Preview template
  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    if (onPreview) {
      onPreview({
        ...templateData,
        content: editorContent
      });
    }
  };

  // Send test email
  const handleSendTest = () => {
    if (onSend) {
      onSend({
        ...templateData,
        content: editorContent
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              name="subject"
              value={templateData.subject}
              onChange={handleTemplateDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter email subject..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview Text</label>
            <input
              type="text"
              name="previewText"
              value={templateData.previewText}
              onChange={handleTemplateDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter preview text..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
            <input
              type="text"
              name="fromName"
              value={templateData.fromName}
              onChange={handleTemplateDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="From name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
            <input
              type="email"
              name="fromEmail"
              value={templateData.fromEmail}
              onChange={handleTemplateDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="From email..."
            />
          </div>
        </div>
      </div>

      {/* Template Variables */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Variables</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templateVariables.map(variable => (
            <button
              key={variable.name}
              onClick={() => insertVariable(variable.name)}
              className="p-3 border border-gray-300 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition text-left"
            >
              <div className="font-medium text-gray-900">{variable.description}</div>
              <div className="text-sm text-gray-500">{variable.name}</div>
              <div className="text-xs text-gray-400 mt-1">Example: {variable.example}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => formatText('bold')}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <div className="w-px h-8 bg-gray-300 mx-1"></div>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <div className="w-px h-8 bg-gray-300 mx-1"></div>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Insert Link"
          >
            <Link size={16} />
          </button>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Insert Image"
          >
            <Image size={16} />
          </button>
          <div className="w-px h-8 bg-gray-300 mx-1"></div>
          <button
            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            title="Code View"
          >
            <Code size={16} />
          </button>
        </div>

        {/* Editor Content */}
        <div className="border border-gray-300 rounded-lg">
          <textarea
            id="email-content"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-96 p-4 border-0 rounded-lg focus:outline-none resize-none"
            placeholder="Start writing your email template here... Use the variables above to personalize your content."
          />
        </div>
      </div>

      {/* Preview Section */}
      {isPreviewMode && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Preview</h3>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="mb-4">
              <div className="text-sm text-gray-600">From: {templateData.fromName} &lt;{templateData.fromEmail}&gt;</div>
              <div className="text-sm text-gray-600">Subject: {templateData.subject}</div>
              {templateData.previewText && (
                <div className="text-sm text-gray-500 mt-1">{templateData.previewText}</div>
              )}
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: editorContent }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
        >
          <Save size={16} /> Save Template
        </button>
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Eye size={16} /> {isPreviewMode ? 'Hide Preview' : 'Preview'}
        </button>
        <button
          onClick={handleSendTest}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Send size={16} /> Send Test
        </button>
        <button className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
