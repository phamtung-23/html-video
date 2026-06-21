/**
 * Tiny i18n for the studio. No build step, no framework.
 *
 * Usage:
 *   import { t, setLocale, getLocale, AVAILABLE_LOCALES } from './i18n.js';
 *   t('toolbar.export_mp4')
 *   setLocale('en')
 *
 * Locale resolution order:
 *   1. localStorage hv.studio.locale
 *   2. DEFAULT_LOCALE = "vi"
 *
 * Strings missing in the active locale fall back to vi, then the key.
 */

export const DEFAULT_LOCALE = 'vi';
export const AVAILABLE_LOCALES = ['vi', 'en'];

const DICT = {
  vi: {
    'app.empty_pick_create': 'Chọn hoặc tạo một dự án',
    'app.empty_subtitle':
      'Mỗi dự án = một video HTML. Chọn một mẫu để xem nền hình ảnh, trò chuyện với agent để điều khiển nội dung, sửa văn bản theo từng khung ở cột giữa, xem kết quả ở bên phải.',
    'app.no_project': 'chưa có dự án',

    'sidebar.projects': 'Dự án',
    'sidebar.new': '+ Mới',
    'sidebar.collapse': 'Thu gọn thanh bên',
    'sidebar.empty_list': 'chưa có dự án nào',
    'sidebar.menu.rename': '✎ Đổi tên',
    'sidebar.menu.delete': '🗑 Xoá',
    'sidebar.rename_prompt': 'Tên dự án mới',
    'sidebar.delete_confirm': 'Xoá "{name}"? Không thể hoàn tác.',

    'toolbar.template': 'Mẫu',
    'toolbar.template_pick': 'Tuỳ chọn · Chọn mẫu',
    'toolbar.agent': 'Agent',
    'toolbar.model': 'Mô hình',
    'toolbar.agent_none': '— không —',
    'toolbar.agent_ready': '● sẵn sàng',
    'toolbar.agent_install': '○ cần cài',
    'toolbar.export_mp4': 'Xuất MP4',

    'composer.placeholder.no_project': 'Chọn một dự án trước…',
    'composer.placeholder.detecting_agents': 'Mô tả video trong khi kiểm tra agent…',
    'composer.placeholder.no_agent': 'Cài Claude Code (claude CLI) để bật trò chuyện…',
    'composer.placeholder.focus':
      'Chỉ sửa khung này (bấm ✕ ở chip phía trên để bỏ chọn)…',
    'composer.placeholder.no_template':
      'Mô tả một video, hoặc dán link bài viết / GitHub repo để dựng từ đó.',
    'composer.placeholder.with_template': 'Mô tả video — nội dung, tên, dữ liệu… hoặc dán link bài viết / GitHub repo.',
    'composer.hint': 'Cmd / Ctrl + Enter · kéo / dán tệp · thả design.md / frame.md để khoá thương hiệu + chuyển động',
    'composer.send': 'Gửi',
    'composer.attach': 'Đính kèm tệp',
    'composer.focus_chip': 'Chỉ sửa khung {order} {fid}',
    'composer.focus_clear': 'Bỏ tập trung',

    'chat.empty.title': 'Gửi một tin nhắn để bắt đầu',
    'chat.empty.body':
      'Nói cho agent biết bạn muốn gì — một thẻ thương hiệu, một teaser nhiều khung, một poster dữ liệu — nó sẽ dựng HTML.',
    'chat.summary.form_submitted': '📋 Đã gửi biểu mẫu',
    'chat.summary.confirm_generate': '✓ Tạo',
    'chat.summary.confirm_edit': '✏️ Sửa',
    'chat.thinking': 'agent đang suy nghĩ',
    'chat.still_generating': '⏳ Dự án này vẫn đang tạo ở chế độ nền — kết quả sẽ hiện ở đây khi xong (tải lại bản xem trước để làm mới).',
    'chat.placeholder.gen_html': '📄 *đang tạo HTML…*',
    'chat.placeholder.plan_graph': '🧭 *đang lên storyboard…*',
    'chat.empty_reply':
      '⚠️ Agent trả về rỗng. Thử diễn đạt lại — ví dụ cho biết thương hiệu / chủ đề / 1-2 chi tiết cụ thể, hoặc loại khung bạn muốn trước.',

    'preview.placeholder.pick_project': 'Chọn một dự án trước.',
    'preview.placeholder.pick_template':
      'Gửi một tin nhắn để tạo HTML đầu tiên.<br>Hoặc chọn một mẫu ở trên để bắt đầu nhanh.',
    'preview.edit_text_on': '✓ Xong chỉnh sửa',
    'preview.edit_text_off': '✎ Sửa văn bản',
    'preview.edit_text_title': 'Bấm vào văn bản bất kỳ trong bản xem trước để sửa',
    'preview.edit_text_done_title': 'Hoàn tất chỉnh sửa',
    'preview.reload': '↻ Tải lại bản xem trước',
    'preview.no_hv_text':
      'Khung này không có văn bản chỉnh sửa được (HTML thiếu data-hv-text).',

    'frames.label': 'Khung hình',
    'frames.view_graph': 'Xem graph',
    'frames.enhance': '⚡ Remotion',
    'frames.enhance_hint': 'Render khung dữ liệu này bằng Remotion gốc (số chạy, cột mọc)',
    'frames.enhanced_revert': '⚡ Remotion ✓ (hoàn tác)',
    'frames.enhancing': '⚡ {pct}%…',
    'enhance.done': '⚡ Đã render khung bằng Remotion',
    'enhance.failed': '⚡ Remotion thất bại: {message}',

    'text_pane.title': 'Văn bản khung',
    'text_pane.no_project': 'Không có dự án.',
    'text_pane.empty_with_frames':
      'Khung này không có văn bản chỉnh sửa được. Chuyển sang khung khác, hoặc bấm ✎ Sửa văn bản trên canvas.',
    'text_pane.empty_no_frames':
      'Chưa có văn bản chỉnh sửa được. Gửi một tin nhắn để tạo phiên bản HTML đầu tiên, sau đó các ô văn bản theo khung sẽ hiện ở đây.',
    'text_pane.collapse': 'Thu gọn bảng',
    'text_pane.save_state.idle': '—',
    'text_pane.save_state.typing': 'đang gõ…',
    'text_pane.save_state.saving': 'đang lưu…',
    'text_pane.save_state.saved': 'đã lưu',
    'text_pane.save_state.error': 'lỗi',

    'export.starting': '⏵ Đang bắt đầu xuất MP4…',
    'export.button_running': '⏵ {pct}% · {stage}',
    'export.done_seconds': '✓ Đã xuất MP4 · {seconds}',
    'export.done_no_seconds': '✓ Đã xuất MP4',
    'export.failed': '⚠️ Xuất thất bại: {message}',
    'export.stream_interrupted': 'Luồng xuất bị gián đoạn: {message}',
    'export.failed_short': 'Xuất thất bại: {message}',
    'export.title': '🎬 MP4 đã sẵn sàng',
    'export.reveal': 'Hiện trong Finder',
    'export.copy_path': 'Sao chép đường dẫn',
    'export.copied': 'Đã sao chép đường dẫn',
    'export.copy_failed': 'Sao chép thất bại: {message}',
    'export.reveal_failed': 'Mở thất bại: {message}',

    'soundtrack.title': '🎙 Thêm lời thoại / thuyết minh',
    'soundtrack.summary_sub': 'Giọng đọc tiếng Việt miễn phí, trộn vào video khi xuất',
    'soundtrack.optional': 'tuỳ chọn',
    'soundtrack.hint': 'Lời thoại được trộn vào MP4 khi xuất.',
    'soundtrack.narration_label': 'Lời thoại / thuyết minh',
    'soundtrack.step_write': 'Viết kịch bản (văn bản)',
    'soundtrack.step_voice': 'Tổng hợp giọng nói (âm thanh)',
    'soundtrack.editing_frame': '· đang sửa khung {n}/{total}',
    'soundtrack.draft_frame': '✨ Soạn khung này',
    'soundtrack.draft_all': '✨ Soạn tất cả khung',
    'soundtrack.gen_narration': '🎙 Tổng hợp giọng đọc',
    'soundtrack.empty_narration': 'Thêm nội dung lời thoại trước (✨ để soạn tự động).',
    'soundtrack.frame_word': 'Khung',
    'soundtrack.total_word': 'Tổng',
    'soundtrack.drafting': 'Đang soạn…',
    'soundtrack.draft_need_frames': 'Tạo video trước',
    'soundtrack.draft_failed': '⚠️ Soạn thất bại: {message}',
    'soundtrack.narration_placeholder': 'Mỗi khung một dòng — bấm ✨ để soạn từ video (để trống nếu không cần)',
    'soundtrack.voice_label': 'Giọng',
    'soundtrack.voice_vi_female_edge': 'Tiếng Việt · Nữ (Edge, miễn phí)',
    'soundtrack.voice_vi_male_edge': 'Tiếng Việt · Nam (Edge, miễn phí)',
    'soundtrack.fit_durations': '⇄ Khớp thời lượng theo lời thoại',
    'soundtrack.fit_hint': 'Phân bổ lại thời lượng từng khung theo độ dài lời thoại',
    'soundtrack.fitting': 'Đang khớp…',
    'soundtrack.fitted': '✓ Đã khớp thời lượng khung theo lời thoại · tổng {sec}s',
    'soundtrack.fit_failed': 'Không thể khớp thời lượng',
    'soundtrack.narration_volume': 'Âm lượng lời thoại',
    'soundtrack.clear': 'Xoá',
    'soundtrack.starting': '⏵ Đang tạo lời thoại…',
    'soundtrack.progress_narration': '⏵ Đang tạo lời thoại…',
    'soundtrack.done': '✓ Lời thoại đã sẵn sàng — sẽ được trộn vào khi xuất',
    'soundtrack.failed': '⚠️ Tạo lời thoại thất bại: {message}',
    'soundtrack.narration_ready': 'Lời thoại',

    'graph.title': 'Content graph',
    'graph.download': '⬇ Tải JSON',
    'graph.close': '✕',
    'graph.empty': '(dự án không có graph)',
    'graph.error': 'lỗi tải graph: {message}',

    'gallery.title': 'Chọn một mẫu',
    'gallery.close': '✕',

    'modal.new.title': 'Dự án mới',
    'modal.new.name_label': 'Tên',
    'modal.new.name_placeholder': 'vd: teaser ra mắt nexu-io',
    'modal.new.intent_label': 'Mục đích (tuỳ chọn)',
    'modal.new.intent_placeholder': 'Một dòng mô tả video này nói về gì',
    'modal.new.cancel': 'Huỷ',
    'modal.new.create': 'Tạo',
    'modal.new.name_required': 'Cần nhập tên',
    'modal.new.created': 'Đã tạo "{name}"',
    'modal.new.failed': 'Tạo dự án thất bại',

    'language.label': 'Ngôn ngữ',

    'card.freeform_placeholder': '…hoặc tự nhập câu trả lời',
    'card.send': '↵ Gửi',

    'settings.title': 'Cài đặt',
    'settings.tab.agent': 'Agent',
    'settings.tab.language': 'Ngôn ngữ',
    'settings.tab.about': 'Giới thiệu',

    'settings.agent.title': 'Agent',
    'settings.agent.subtitle': 'Chọn runtime biến cuộc trò chuyện của bạn thành HTML.',
    'settings.agent.mode.local': 'CLI cục bộ',
    'settings.agent.mode.byok': 'BYOK (API)',
    'settings.agent.detected': 'Agent đã phát hiện ({count})',
    'settings.agent.test': 'Kiểm tra',
    'settings.agent.testing': 'Đang kiểm tra…',
    'settings.agent.test_ok': 'OK · {ms}ms · {bytes}B',
    'settings.agent.test_fail': 'Thất bại: {message}',
    'settings.agent.empty_reply': 'Thất bại: agent trả về rỗng',
    'settings.agent.use': 'Dùng',
    'settings.agent.in_use': 'Đang dùng',
    'settings.agent.unavailable': 'Chưa cài',
    'agent.sign_in': 'Đăng nhập',
    'agent.signing_in': 'Đang đăng nhập…',
    'agent.signed_in': '✓ Đã đăng nhập AMR',
    'agent.sign_in_failed': 'Đăng nhập thất bại',
    'agent.recommended': 'Khuyến nghị · một lần đăng nhập, nhiều mô hình',
    'settings.agent.byok.intro': 'Dùng API key Anthropic / OpenRouter của bạn. Đọc từ biến môi trường:',
    'settings.agent.byok.env_key': 'ANTHROPIC_API_KEY hoặc ANTHROPIC_AUTH_TOKEN',
    'settings.agent.byok.env_base': 'ANTHROPIC_BASE_URL (tuỳ chọn, mặc định api.anthropic.com)',
    'settings.agent.rescan': '↻ Quét lại',
    'settings.agent.rescanned': 'Đã quét lại',

    'settings.language.title': 'Ngôn ngữ',
    'settings.language.subtitle': 'Ngôn ngữ giao diện Studio. Đổi là áp dụng ngay.',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.en': 'English',
    'settings.language.vi_sub': 'VI',
    'settings.language.en_sub': 'EN',

    'settings.about.title': 'Giới thiệu',
    'settings.about.subtitle': 'html-video — meta-layer HTML→Video mã nguồn mở cho coding agent.',
    'settings.about.version': 'Phiên bản',
    'settings.about.repo': 'Kho mã',
    'settings.about.discord': 'Discord',
    'settings.about.license': 'Giấy phép',
    'settings.about.related': 'Liên quan',

    'toolbar.settings': 'Cài đặt',

    'tpl_preview.cancel': 'Huỷ',
    'tpl_preview.use': 'Dùng mẫu này',
    'tpl_preview.replace_confirm': 'Thay mẫu hiện tại bằng "{name}"? Nội dung xem trước hiện có vẫn giữ nguyên — agent có thể dựng lại ở lần trò chuyện sau.',
    'tpl_preview.applied': 'Mẫu: {name}',
    'tpl_preview.fps_dur': '{fps}fps · {duration}s · {aspect}',
    'tpl_preview.source_skill': 'Phỏng theo',
    'tpl_preview.source_origin': 'Nguồn gốc thiết kế',
    'tpl_preview.source_license': 'Giấy phép',
  },

  en: {
    'app.empty_pick_create': 'Pick or create a project',
    'app.empty_subtitle':
      'Each project = one HTML video. Choose a template to see the visual baseline, chat with your agent to drive the content, edit per-frame text in the middle column, see the result on the right.',
    'app.no_project': 'no project',

    'sidebar.projects': 'Projects',
    'sidebar.new': '+ New',
    'sidebar.collapse': 'Collapse sidebar',
    'sidebar.empty_list': 'no projects yet',
    'sidebar.menu.rename': '✎ Rename',
    'sidebar.menu.delete': '🗑 Delete',
    'sidebar.rename_prompt': 'New project name',
    'sidebar.delete_confirm': 'Delete "{name}"? This cannot be undone.',

    'toolbar.template': 'Template',
    'toolbar.template_pick': 'Optional · Pick template',
    'toolbar.agent': 'Agent',
    'toolbar.model': 'Model',
    'toolbar.agent_none': '— none —',
    'toolbar.agent_ready': '● ready',
    'toolbar.agent_install': '○ install',
    'toolbar.export_mp4': 'Export MP4',

    'composer.placeholder.no_project': 'Pick a project first…',
    'composer.placeholder.detecting_agents': 'Describe the video while we check for agents…',
    'composer.placeholder.no_agent': 'Install Claude Code (claude CLI) to enable chat…',
    'composer.placeholder.focus':
      'Edit only this frame (click ✕ on the chip above to release)…',
    'composer.placeholder.no_template':
      'Describe a video, or paste an article link / GitHub repo to build one from it.',
    'composer.placeholder.with_template': 'Describe the video — content, names, data… or paste an article link / GitHub repo.',
    'composer.hint': 'Cmd / Ctrl + Enter · drag / paste files · drop a design.md / frame.md to lock brand + motion',
    'composer.send': 'Send',
    'composer.attach': 'Attach file',
    'composer.focus_chip': 'Editing only frame {order} {fid}',
    'composer.focus_clear': 'Clear focus',

    'chat.empty.title': 'Send a message to start',
    'chat.empty.body':
      'Tell the agent what you want — a single brand card, a multi-frame teaser, a data poster — and it will scaffold the HTML.',
    'chat.summary.form_submitted': '📋 Form submitted',
    'chat.summary.confirm_generate': '✓ Generate',
    'chat.summary.confirm_edit': '✏️ Edit',
    'chat.thinking': 'agent thinking',
    'chat.still_generating': '⏳ This project is still generating in the background — its result will appear here when done (reload preview to refresh).',
    'chat.placeholder.gen_html': '📄 *generating HTML…*',
    'chat.placeholder.plan_graph': '🧭 *planning storyboard…*',
    'chat.empty_reply':
      '⚠️ The agent returned an empty reply. Try rephrasing your request — e.g. tell it the brand / topic / 1-2 concrete details, or which kind of frame you want first.',

    'preview.placeholder.pick_project': 'Pick a project first.',
    'preview.placeholder.pick_template':
      'Send a chat to generate the first HTML.<br>Or pick a template up top for a quick start.',
    'preview.edit_text_on': '✓ Done editing',
    'preview.edit_text_off': '✎ Edit text',
    'preview.edit_text_title': 'Click any text in the preview to edit',
    'preview.edit_text_done_title': 'Finish editing',
    'preview.reload': '↻ Reload preview',
    'preview.no_hv_text':
      'This frame has no editable text (HTML missing data-hv-text).',

    'frames.label': 'Frames',
    'frames.view_graph': 'View graph',
    'frames.enhance': '⚡ Remotion',
    'frames.enhance_hint': 'Render this data frame natively with Remotion (numbers roll, bars grow)',
    'frames.enhanced_revert': '⚡ Remotion ✓ (revert)',
    'frames.enhancing': '⚡ {pct}%…',
    'enhance.done': '⚡ Frame rendered with Remotion',
    'enhance.failed': '⚡ Remotion failed: {message}',

    'text_pane.title': 'Frame text',
    'text_pane.no_project': 'No project.',
    'text_pane.empty_with_frames':
      'No editable text on this frame. Switch to another frame, or click ✎ Edit text on the canvas.',
    'text_pane.empty_no_frames':
      'No editable text yet. Send a chat to generate the first version of the HTML, then per-frame text fields appear here.',
    'text_pane.collapse': 'Collapse panel',
    'text_pane.save_state.idle': '—',
    'text_pane.save_state.typing': 'typing…',
    'text_pane.save_state.saving': 'saving…',
    'text_pane.save_state.saved': 'saved',
    'text_pane.save_state.error': 'error',

    'export.starting': '⏵ Starting MP4 export…',
    'export.button_running': '⏵ {pct}% · {stage}',
    'export.done_seconds': '✓ MP4 exported · {seconds}',
    'export.done_no_seconds': '✓ MP4 exported',
    'export.failed': '⚠️ Export failed: {message}',
    'export.stream_interrupted': 'Export stream interrupted: {message}',
    'export.failed_short': 'Export failed: {message}',
    'export.title': '🎬 MP4 ready',
    'export.reveal': 'Reveal in Finder',
    'export.copy_path': 'Copy path',
    'export.copied': 'Path copied',
    'export.copy_failed': 'Copy failed: {message}',
    'export.reveal_failed': 'Open failed: {message}',

    'soundtrack.title': '🎙 Add narration / voiceover',
    'soundtrack.summary_sub': 'Free Vietnamese voiceover, mixed into your export',
    'soundtrack.optional': 'optional',
    'soundtrack.hint': 'Narration mixed into the MP4 on export.',
    'soundtrack.narration_label': 'Narration / voiceover',
    'soundtrack.step_write': 'Write the script (text)',
    'soundtrack.step_voice': 'Synthesize the voice (audio)',
    'soundtrack.editing_frame': '· editing frame {n}/{total}',
    'soundtrack.draft_frame': '✨ Draft this frame',
    'soundtrack.draft_all': '✨ Draft all frames',
    'soundtrack.gen_narration': '🎙 Synthesize voiceover',
    'soundtrack.empty_narration': 'Add narration text first (✨ to draft it).',
    'soundtrack.frame_word': 'Frame',
    'soundtrack.total_word': 'Total',
    'soundtrack.drafting': 'Drafting…',
    'soundtrack.draft_need_frames': 'Generate the video first',
    'soundtrack.draft_failed': '⚠️ Draft failed: {message}',
    'soundtrack.narration_placeholder': 'One line per frame — click ✨ to draft from the video (leave empty for none)',
    'soundtrack.voice_label': 'Voice',
    'soundtrack.voice_vi_female_edge': 'Vietnamese · Female (Edge, free)',
    'soundtrack.voice_vi_male_edge': 'Vietnamese · Male (Edge, free)',
    'soundtrack.fit_durations': '⇄ Fit timing to narration',
    'soundtrack.fit_hint': 'Re-pace each frame by how much narration it has',
    'soundtrack.fitting': 'Fitting…',
    'soundtrack.fitted': '✓ Frame timing fit to narration · {sec}s total',
    'soundtrack.fit_failed': 'Could not fit timing',
    'soundtrack.narration_volume': 'Narration volume',
    'soundtrack.clear': 'Clear',
    'soundtrack.starting': '⏵ Generating narration…',
    'soundtrack.progress_narration': '⏵ Generating narration…',
    'soundtrack.done': '✓ Narration ready — it will be mixed in on export',
    'soundtrack.failed': '⚠️ Narration failed: {message}',
    'soundtrack.narration_ready': 'Narration',

    'graph.title': 'Content graph',
    'graph.download': '⬇ Download JSON',
    'graph.close': '✕',
    'graph.empty': '(no graph for this project)',
    'graph.error': 'error loading graph: {message}',

    'gallery.title': 'Pick a template',
    'gallery.close': '✕',

    'modal.new.title': 'New project',
    'modal.new.name_label': 'Name',
    'modal.new.name_placeholder': 'e.g. nexu-io launch teaser',
    'modal.new.intent_label': 'Intent (optional)',
    'modal.new.intent_placeholder': 'A one-line description of what this video is about',
    'modal.new.cancel': 'Cancel',
    'modal.new.create': 'Create',
    'modal.new.name_required': 'Name is required',
    'modal.new.created': 'Created "{name}"',
    'modal.new.failed': 'Failed to create project',

    'language.label': 'Language',

    'card.freeform_placeholder': '…or type your own answer',
    'card.send': '↵ Send',

    'settings.title': 'Settings',
    'settings.tab.agent': 'Agent',
    'settings.tab.language': 'Language',
    'settings.tab.about': 'About',

    'settings.agent.title': 'Agent',
    'settings.agent.subtitle': 'Pick the runtime that turns your chat into HTML.',
    'settings.agent.mode.local': 'Local CLI',
    'settings.agent.mode.byok': 'BYOK (API)',
    'settings.agent.detected': 'Detected agents ({count})',
    'settings.agent.test': 'Test',
    'settings.agent.testing': 'Testing…',
    'settings.agent.test_ok': 'OK · {ms}ms · {bytes}B',
    'settings.agent.test_fail': 'Failed: {message}',
    'settings.agent.empty_reply': 'Failed: agent returned an empty reply',
    'settings.agent.use': 'Use',
    'settings.agent.in_use': 'In use',
    'settings.agent.unavailable': 'Not installed',
    'agent.sign_in': 'Sign in',
    'agent.signing_in': 'Signing in…',
    'agent.signed_in': '✓ Signed in to AMR',
    'agent.sign_in_failed': 'Sign-in failed',
    'agent.recommended': 'Recommended · one login, many models',
    'settings.agent.byok.intro': 'Use your own Anthropic / OpenRouter API key. Reads from environment:',
    'settings.agent.byok.env_key': 'ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN',
    'settings.agent.byok.env_base': 'ANTHROPIC_BASE_URL (optional, defaults to api.anthropic.com)',
    'settings.agent.rescan': '↻ Rescan',
    'settings.agent.rescanned': 'Rescanned',

    'settings.language.title': 'Language',
    'settings.language.subtitle': 'Studio interface language. Re-renders instantly.',
    'settings.language.vi': 'Tiếng Việt',
    'settings.language.en': 'English',
    'settings.language.vi_sub': 'VI',
    'settings.language.en_sub': 'EN',

    'settings.about.title': 'About',
    'settings.about.subtitle': 'html-video — open-source HTML→Video meta-layer for coding agents.',
    'settings.about.version': 'Version',
    'settings.about.repo': 'Repo',
    'settings.about.discord': 'Discord',
    'settings.about.license': 'License',
    'settings.about.related': 'Related',

    'toolbar.settings': 'Settings',

    'tpl_preview.cancel': 'Cancel',
    'tpl_preview.use': 'Use this template',
    'tpl_preview.replace_confirm': 'Replace current template with "{name}"? Existing preview content stays put — the agent can rebuild on next chat.',
    'tpl_preview.applied': 'Template: {name}',
    'tpl_preview.fps_dur': '{fps}fps · {duration}s · {aspect}',
    'tpl_preview.source_skill': 'Adapted from',
    'tpl_preview.source_origin': 'Design lineage',
    'tpl_preview.source_license': 'License',
  },
};

const STORAGE_KEY = 'hv.studio.locale';
let _locale = resolveInitialLocale();

function resolveInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.includes(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  // Default is Vietnamese; users can switch in Settings → Language.
  return DEFAULT_LOCALE;
}

export function getLocale() {
  return _locale;
}

export function setLocale(loc) {
  if (!AVAILABLE_LOCALES.includes(loc)) return;
  _locale = loc;
  try { localStorage.setItem(STORAGE_KEY, loc); } catch {}
  // Notify listeners (the studio app re-renders).
  document.dispatchEvent(new CustomEvent('hv-locale-change', { detail: { locale: loc } }));
}

/**
 * Apply i18n to static DOM elements. Markers:
 *   data-i18n="key"          → textContent
 *   data-i18n-attr="placeholder:key,title:key2"  → set those attrs
 *   data-i18n-html="key"     → innerHTML (caution: only for trusted keys)
 *
 * Call once after DOMContentLoaded and also on every locale change.
 */
export function applyDomI18n(root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  r.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  r.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const pairs = (el.dataset.i18nAttr || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

document.addEventListener('hv-locale-change', () => applyDomI18n());
document.addEventListener('DOMContentLoaded', () => applyDomI18n());

/**
 * Translate a key. `params` is a plain object whose keys substitute
 * `{key}` placeholders in the resolved string.
 */
export function t(key, params) {
  const dict = DICT[_locale] ?? DICT[DEFAULT_LOCALE];
  let s = dict[key];
  if (s === undefined) {
    // Fall back to the default locale, then to the key itself.
    s = DICT[DEFAULT_LOCALE][key] ?? key;
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
