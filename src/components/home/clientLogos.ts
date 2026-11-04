import mr from "@/assets/logos/clients/mr.svg";
import noventaENove from "@/assets/logos/clients/99.svg";
import sura from "@/assets/logos/clients/sura.svg";
import cesconBarrieu from "@/assets/logos/clients/cescon-barrieu.svg";
import fabioKadi from "@/assets/logos/clients/fabio-kadi.svg";
import roda from "@/assets/logos/clients/roda.png";
import bomSabor from "@/assets/logos/clients/bom-sabor.png";

/**
 * Client logos, taken from each company's official website (04/11/2026) and
 * shown in a single neutral gray. `height` is in px and balances optical size,
 * since the marks have very different proportions.
 */
export const CLIENT_LOGOS: Array<{ name: string; src: string; height: number }> = [
  { name: "Maschinenfabrik Reinhausen", src: mr, height: 40 },
  { name: "99", src: noventaENove, height: 28 },
  { name: "Seguros Sura", src: sura, height: 30 },
  { name: "Cescon Barrieu", src: cesconBarrieu, height: 34 },
  { name: "Fabio Kadi Advogados", src: fabioKadi, height: 34 },
  { name: "Roda Conveniência", src: roda, height: 28 },
  { name: "Bom Sabor", src: bomSabor, height: 42 },
];
