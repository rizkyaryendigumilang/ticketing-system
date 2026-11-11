# Issue Tracker Configuration

- **Platform:** GitHub Issues
- **Repository:** https://github.com/rizkyaryendigumilang/ticketing-system
- **CLI Tool:** `gh issue create`, `gh issue list`, `gh issue view`
- **Workflow:** Issue dikelola via antrean GitHub Issues dengan label triage:
  - `needs-triage`: Isu baru membutuhkan evaluasi.
  - `needs-info`: Butuh informasi atau klarifikasi tambahan dari pelapor.
  - `ready-for-agent`: Siap dieksekusi secara otomatis oleh AI Coding Agent.
  - `ready-for-human`: Membutuhkan tinjauan atau keputusan arsitektur manual manusia.
  - `wontfix`: Tidak akan diimplementasikan.
