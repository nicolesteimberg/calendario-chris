# Calendário de postagens do Chris

Site estático do calendário de postagens no YouTube, TikTok e Instagram (conta de teste e reels). É a versão pública da página interna, no estilo do Google Agenda: vista de mês com totais, grade de horas no dia e na semana, e filtros por plataforma.

Não há senha. Quem tiver o endereço vê o calendário. Por isso o `data.json` só leva título, plataforma, horário, status, links públicos e notas curtas. Sem chaves, IDs de conta, IDs internos de agendamento ou caminhos de arquivo.

Repositório previsto: `https://github.com/nicolesteimberg/calendario-chris`
Endereço previsto do site: `https://nicolesteimberg.github.io/calendario-chris/`

## Arquivos no repositório público

- `index.html`, `app.js`, `styles.css` — o site (sem etapa de build e sem bibliotecas, só a fonte Inter do Google Fonts).
- `data.json` — os posts já filtrados para o público.
- `.nojekyll` — para o GitHub Pages não processar os arquivos.
- `README.md` — este arquivo.

O script `build_data.py` fica só na máquina da operação e **não entra** no repositório público: ele contém caminhos internos das fontes locais.

## Como atualizar o data.json (máquina da operação)

No computador que tem as fontes da operação (ledger dos cortes, logs, filas e status dos reels longos):

```bash
cd calendario-site
python3 build_data.py
```

O script só lê arquivos locais. Ele não chama API de redes e não grava dado interno no `data.json`. Se um caminho estiver em outro lugar, use as variáveis `CAL_LEDGER`, `CAL_LOGS`, `CAL_META_DIR`, `CAL_FILA_GAVETA`, `CAL_FILA_MOTION` e `CAL_REELS_LONGOS`.

## Como republicar o data.json

Depois de gerar o arquivo novo, atualize só o `data.json` na raiz da branch `main` do repositório `nicolesteimberg/calendario-chris`. O GitHub Pages passa a mostrar a revisão em alguns minutos. O site não se atualiza sozinho a cada post.

Pelo conector `cursor-github` isso ainda não é possível: o conector não tem ferramenta para criar ou atualizar arquivos (`create_or_update_file`, `push_files` ou equivalente). Também não tem ferramenta para criar o repositório nem para ligar o GitHub Pages. Enquanto essas ferramentas não existirem, a republicação é um commit local seguido de push:

```bash
git add data.json
git commit -m "Atualiza o calendário de postagens"
git push origin main
```

Não reenvie `build_data.py`, caminhos internos, IDs de conta ou chaves.

## Como publicar no GitHub Pages

1. Crie o repositório público `calendario-chris` na conta `nicolesteimberg`.
2. Envie na raiz da branch `main` os arquivos públicos listados acima (sem o `build_data.py`).
3. Em Settings → Pages, escolha a branch `main` e a pasta `/` (raiz).
4. O endereço fica `https://nicolesteimberg.github.io/calendario-chris/`.

Para testar na máquina, sem publicar:

```bash
python3 -m http.server 8080
```

Abra `http://127.0.0.1:8080`. Abrir o `index.html` direto no disco não carrega o `data.json`.

## Como ler o resumo

No topo há dois blocos, **Hoje** e **Semana** (a semana que está na tela), com um cartão por plataforma:

- **Saíram**: posts que já estão no ar.
- **Previstos**: agendados no Zernio + horários da rotina (fila do TikTok 18h e 22h em dias úteis) que ainda vão sair.
- **Falharam**: houve tentativa e o post não foi ao ar.
- **Bloqueados**: nem chegaram a ser enviados (ex.: conexão do YouTube expirada).
- **Horário passou**: estava agendado/previsto, o horário já passou e o site ainda não foi atualizado.

Horários sem vídeo (motion sem áudio, dia sem corte) aparecem no calendário, mas não entram nas contas. Clique num número para ver os posts. Os cartões respeitam o filtro de plataformas.

## Horário

Datas e horários estão em America/São Paulo (BRT, GMT-3). A linha vermelha da vista Dia/Semana usa a hora atual nesse fuso.
