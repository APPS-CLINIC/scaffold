import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFileFromResponse } from './baseApi';

function makeResponse(body: BlobPart[], headers?: HeadersInit): Response {
  return new Response(new Blob(body), { headers });
}

describe('downloadFileFromResponse', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('triggers a download using the filename from Content-Disposition', async () => {
    const objectUrl = 'blob:https://app.test/generated-id';
    URL.createObjectURL = vi.fn(() => objectUrl);
    URL.revokeObjectURL = vi.fn();
    let capturedDownload = '';
    let capturedHref = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedDownload = this.download;
      capturedHref = this.href;
    });
    const response = makeResponse(['file contents'], {
      'Content-Disposition': 'attachment; filename="customers.xlsx"',
    });

    await downloadFileFromResponse(response, 'default.xlsx');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl);
    expect(capturedDownload).toBe('customers.xlsx');
    expect(capturedHref).toBe('blob:https://app.test/generated-id');
  });

  it('falls back to the default filename when Content-Disposition is missing', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:https://app.test/no-header');
    URL.revokeObjectURL = vi.fn();
    let capturedDownload = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedDownload = this.download;
    });
    const response = makeResponse(['file contents']);

    await downloadFileFromResponse(response, 'default.xlsx');

    expect(capturedDownload).toBe('default.xlsx');
  });
});
