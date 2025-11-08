import { useState, useEffect } from 'react';
import { Save, Loader2, ChevronDown } from 'lucide-react';
import { saveNotification, fetchUserGroups, UserGroup } from '../lib/api';
import Toast from '../components/Toast';

const NewNotification = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState<string>('');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    loadUserGroups();
  }, []);

  const loadUserGroups = async () => {
    try {
      setLoadingUserGroups(true);
      const data = await fetchUserGroups();
      setUserGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load user groups:', error);
      showToast('Failed to load user groups', 'error');
    } finally {
      setLoadingUserGroups(false);
    }
  };

  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true; // Empty is valid (optional)
    
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonData(value);
    if (value.trim() && !validateJson(value)) {
      setJsonError('Invalid JSON format');
    } else {
      setJsonError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (jsonError) {
      showToast('Please fix JSON errors before submitting', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        title: title.trim(),
        body: body.trim(),
        ...(jsonData.trim() && { data: JSON.parse(jsonData) }),
        userGroup: selectedUserGroup || 'allUsers',
      };

      await saveNotification(payload);
      
      showToast('Notification saved successfully!', 'success');
      
      // Reset form
      setTitle('');
      setBody('');
      setJsonData('');
      setJsonError('');
      setSelectedUserGroup('');
    } catch (error) {
      showToast('Failed to save notification', 'error');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Notification</h1>
          <p className="mt-2 text-gray-600">Compose and save a new push notification</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter notification title"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-semibold text-gray-700 mb-2">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              placeholder="Enter notification body/message"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="jsonData" className="block text-sm font-semibold text-gray-700 mb-2">
              Optional JSON Data
            </label>
            <textarea
              id="jsonData"
              value={jsonData}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={6}
              placeholder='{"key": "value"}'
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all resize-none font-mono text-sm ${
                jsonError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
              }`}
            />
            {jsonError && (
              <p className="mt-2 text-sm text-red-600">{jsonError}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Optional: Add additional data as valid JSON object
            </p>
          </div>

          <div>
            <label htmlFor="userGroup" className="block text-sm font-semibold text-gray-700 mb-2">
              User Group
            </label>
            <div className="relative">
              <select
                id="userGroup"
                value={selectedUserGroup}
                onChange={(e) => setSelectedUserGroup(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent appearance-none pr-10"
              >
                <option value="">All Users (default)</option>
                {loadingUserGroups ? (
                  <option disabled>Loading groups...</option>
                ) : (
                  userGroups
                    .filter((group) => {
                      const displayName = (group.metaName || group.name || group.id).toLowerCase();
                      return displayName !== 'all users';
                    })
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.metaName || group.name || group.id} {group.tokens ? `(${group.tokens.length} users)` : ''}
                      </option>
                    ))
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Select a user group to target specific users, or leave as "All Users" to send to everyone
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !!jsonError}
              className="w-full px-6 py-3 bg-apple-blue text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default NewNotification;

