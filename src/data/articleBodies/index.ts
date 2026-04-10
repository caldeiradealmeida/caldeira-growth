import comoVender530 from "./como-vender-530-livros-sistema";
import experimento650 from "./experimento-650";
import vortex from "./vortex-do-crescimento";
import jornadaAutor from "./jornada-autor";
import habilidadesIa from "./habilidades-ia-lideres-exponenciais";
import sorteOusados from "./sorte-ajuda-ousados";
import rumosMetas from "./rumos-metas-objetivos";
import intuicao from "./intuicao-dashboards-decisoes";
import modeloNegocio from "./modelo-negocio-valor";
import exVpTitulos from "./ex-vp-titulos";
import vendaPermissao from "./venda-sem-pedir-permissao";
import seniorTarefas from "./senior-tarefas-simples";

export const articleBodies = {
  "como-vender-530-livros-sistema": comoVender530,
  "experimento-650": experimento650,
  "vortex-do-crescimento": vortex,
  "jornada-autor": jornadaAutor,
  "habilidades-ia-lideres-exponenciais": habilidadesIa,
  "sorte-ajuda-ousados": sorteOusados,
  "rumos-metas-objetivos": rumosMetas,
  "intuicao-dashboards-decisoes": intuicao,
  "modelo-negocio-valor": modeloNegocio,
  "ex-vp-titulos-identidade": exVpTitulos,
  "venda-sem-pedir-permissao": vendaPermissao,
  "senior-tarefas-simples": seniorTarefas,
} as const;

export type ArticleSlug = keyof typeof articleBodies;
