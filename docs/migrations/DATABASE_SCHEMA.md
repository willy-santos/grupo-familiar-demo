# ADNA — Database Schema (Oficial V1)

Este documento define quais tabelas fazem parte da V1 do ADNA.

Nenhuma nova feature deve utilizar tabelas marcadas como LEGADO.

---

# Tabelas oficiais (V1)

## auth.users
Responsável pela autenticação.

Status:
✅ Oficial

---

## public.profiles

Responsável pelos perfis dos usuários.

Consumidores:

- currentUser.ts
- usersData.ts
- Gestão de Usuários

Status:
✅ Oficial

---

## public.grupos

Responsável pelos Grupos Familiares.

Consumidores:

- groupsData.ts
- Relatórios
- View As Líder

Status:
✅ Oficial

---

## public.reports

Responsável pelos relatórios semanais.

Consumidores:

- reportsData.ts
- Analytics
- Dashboard
- Gráficos

Status:
✅ Oficial

---

# Tabelas legadas

Estas tabelas NÃO devem ser utilizadas em novas funcionalidades.

Permanecem apenas por compatibilidade.

## groups

Status:
LEGADO

Substituída por:

public.grupos

---

## members

Status:
LEGADO

Hoje a identidade oficial é public.profiles.

---

## campo

LEGADO

---

## areas

LEGADO

---

## congregations

LEGADO

---

## roles

LEGADO

---

## user_roles

LEGADO

---

## audit_logs

LEGADO (avaliar uso futuro)

---

## events

LEGADO

---

## lessons

LEGADO

---

## files

LEGADO

---

## photos

LEGADO

---

## notifications

LEGADO

---

## offering_settings

LEGADO

---

## offerings

LEGADO

---

## settings

LEGADO

---

# Regra

A arquitetura oficial da V1 utiliza apenas:

auth.users

↓

profiles

↓

grupos

↓

reports

Toda nova funcionalidade deverá utilizar exclusivamente estas tabelas.