import { useState } from 'react';
import type { Connection, DatabaseType } from '../../types/connection';
import { useConnectionStore } from '../../store/connectionStore';

interface ConnectionFormProps {
  onClose: () => void;
  existingConnection?: Connection;
}

interface TestResult {
  success: boolean;
  message: string;
}

const CONNECTION_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
] as const;

const DEFAULT_PORT = 3306;

function createInitialFormData(existing?: Connection): Partial<Connection> {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: existing?.name ?? '',
    color: existing?.color ?? CONNECTION_COLORS[0].value,
    db_type: existing?.db_type ?? 'MySQL',
    host: existing?.host ?? 'localhost',
    port: existing?.port ?? DEFAULT_PORT,
    username: existing?.username ?? '',
    password: existing?.password ?? '',
    database: existing?.database ?? '',
  };
}

function validateFormData(data: Partial<Connection>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name) errors.name = 'Connection name is required';
  if (!data.host) errors.host = 'Host is required';
  if (!data.username) errors.username = 'Username is required';
  return errors;
}

export default function ConnectionForm({ onClose, existingConnection }: ConnectionFormProps): JSX.Element {
  const { saveConnection, testConnection } = useConnectionStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [formData, setFormData] = useState<Partial<Connection>>(() =>
    createInitialFormData(existingConnection)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof Connection>(field: K, value: Connection[K]): void {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const newErrors = validateFormData(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    try {
      await saveConnection(formData as Connection);
      onClose();
    } catch (error) {
      setErrors({ submit: String(error) });
    }
  }

  async function handleTest(): Promise<void> {
    if (!validate()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const message = await testConnection(formData as Connection);
      setTestResult({ success: true, message });
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setTesting(false);
    }
  }

  function getInputClassName(fieldName: string): string {
    const baseClass = 'w-full px-3 py-2 border rounded-md';
    return errors[fieldName]
      ? `${baseClass} border-red-500`
      : `${baseClass} border-gray-300`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {existingConnection ? 'Edit Connection' : 'New Connection'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Connection Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Connection Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={getInputClassName('name')}
                placeholder="My Database"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-semibold mb-1">Connection Color</label>
              <div className="flex gap-2">
                {CONNECTION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => updateField('color', color.value)}
                    className={`w-10 h-10 rounded-md border-2 ${
                      formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    data-testid={`color-option-${color.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            {/* Database Type */}
            <div>
              <label className="block text-sm font-semibold mb-1">Database Type</label>
              <select
                value={formData.db_type}
                onChange={(e) => updateField('db_type', e.target.value as DatabaseType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MySQL">MySQL</option>
                <option value="PostgreSQL">PostgreSQL</option>
              </select>
            </div>

            {/* Host and Port */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => updateField('host', e.target.value)}
                  className={getInputClassName('host')}
                  placeholder="localhost"
                />
                {errors.host && <p className="text-red-500 text-sm mt-1">{errors.host}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => updateField('port', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Username and Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className={getInputClassName('username')}
                  placeholder="root"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="********"
                />
              </div>
            </div>

            {/* Database Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">Database (optional)</label>
              <input
                type="text"
                value={formData.database ?? ''}
                onChange={(e) => updateField('database', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="my_database"
              />
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-md ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {testResult.message}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 rounded-md bg-red-50 text-red-800">{errors.submit}</div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
