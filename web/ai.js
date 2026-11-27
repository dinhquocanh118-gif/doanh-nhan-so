let loading;
const modelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
export async function generate(system, prompt, status) {
  if (!navigator.gpu || !(await navigator.gpu.requestAdapter()))
    throw Error('Thiết bị chưa hỗ trợ WebGPU. Bạn vẫn có thể dùng bản trích xuất và tra cứu theo nguồn.');
  if (!loading) {
    if (
      !confirm(
        'Tải mô hình Qwen về thiết bị để dùng AI? Lần đầu cần tải khoảng 1 GB và có thể mất vài phút. Nội dung hồ sơ được xử lý trên thiết bị.',
      )
    )
      return null;
    status('Đang chuẩn bị mô hình…');
    loading = import('@mlc-ai/web-llm')
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(modelId, { initProgressCallback: (p) => status(p.text) }, { context_window_size: 4096 }),
      )
      .catch((e) => {
        loading = null;
        throw e;
      });
  }
  const engine = await loading;
  status('AI đang soạn gợi ý…');
  const answer = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 220,
  });
  return answer.choices[0]?.message?.content?.trim() || null;
}
