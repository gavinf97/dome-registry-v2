import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

const COPILOT_URL = process.env.COPILOT_URL ?? 'http://copilot:8000';
const COPILOT_TIMEOUT = Number(process.env.COPILOT_TIMEOUT_MS ?? 120_000);

@Injectable()
export class CopilotService {
  async process(params: {
    pdfBuffer: Buffer;
    doi?: string;
    sections?: string[];
    apiKey?: string;
    customModel?: string;
  }): Promise<any> {
    const { pdfBuffer, doi, sections, apiKey, customModel } = params;

    const payload = {
      pdf_b64: pdfBuffer.toString('base64'),
      doi: doi ?? null,
      sections: sections ?? ['all'],
      api_key: apiKey ?? null,
      custom_model: customModel ?? null,
    };

    try {
      const response = await axios.post(`${COPILOT_URL}/process`, payload, {
        timeout: COPILOT_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
      });
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err.message ?? 'Copilot service error';
      throw new ServiceUnavailableException(`DOME Copilot failed: ${msg}`);
    }
  }
}
