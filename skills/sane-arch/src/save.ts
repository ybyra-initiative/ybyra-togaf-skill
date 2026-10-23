/**
 * Persist the spec (PLAN §7 / reconciliation 2): drags mutate local state
 * only; Ctrl+S / the Save button PUTs. The ajv gate runs server-side before
 * every write — an invalid spec comes back as 422 + the error list.
 */
export interface SaveResult {
  ok: boolean;
  errors?: string[];
}

export async function saveSpec(spec: unknown): Promise<SaveResult> {
  let response: Response;
  try {
    response = await fetch('/api/spec', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec, null, 2),
    });
  } catch (err) {
    return { ok: false, errors: [`could not reach the server: ${String(err)}`] };
  }
  if (response.ok) return { ok: true };
  if (response.status === 422) {
    const body = (await response.json().catch(() => ({ errors: ['invalid spec (422)' ] }))) as {
      errors?: string[];
    };
    return { ok: false, errors: body.errors ?? ['invalid spec (422)'] };
  }
  return { ok: false, errors: [`unexpected server response: HTTP ${response.status}`] };
}
