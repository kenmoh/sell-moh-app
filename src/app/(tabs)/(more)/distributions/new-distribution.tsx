import { CreateDistributionScreen } from "./index";
import { useSession } from "@/lib/ctx";
import { useActiveStore } from "@/lib/store-context";
import { useMemo } from "react";

const NewDistribution = () => {
  const { stores } = useActiveStore();
  const { user } = useSession();
  const warehouseStores = useMemo(
    () => (stores ?? []).filter((store) => store.is_warehouse),
    [stores],
  );
  const destinationStores = useMemo(
    () => (stores ?? []).filter((store) => !store.is_warehouse),
    [stores],
  );
  const canCreate =
    user?.permissions?.includes("inventory:distribution_create") ?? false;

  return (
    <CreateDistributionScreen
      warehouseStores={warehouseStores}
      destinationStores={destinationStores}
      disabled={!canCreate || warehouseStores.length === 0}
    />
  );
};

export default NewDistribution;