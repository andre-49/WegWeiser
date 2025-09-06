
from fastapi import APIRouter
from backend.data_loader import TaxonomyGraph

router = APIRouter()
tg = TaxonomyGraph()
tg.load_csvs()
tg.build_graph()

# def node_to_dict(node, data):
#     import math
#     def clean_value(v):
#         return None if (isinstance(v, float) and math.isnan(v)) else v
def node_to_dict(node, data):
    import math
    def clean_value(v):
        return None if (isinstance(v, float) and math.isnan(v)) else v
    return {
        "id": node,
        "type": clean_value(data.get("type")),
        "title": clean_value(data.get("title")),
        "description": clean_value(data.get("description")),
        "code": clean_value(data.get("code")) if "code" in data else None,
        "group_code": clean_value(data.get("group_code")) if "group_code" in data else None,
    }

@router.get("/nodes")
def get_nodes():
    nodes = [node_to_dict(n, tg.graph.nodes[n]) for n in tg.graph.nodes]
    return {"nodes": nodes}

@router.get("/edges")
def get_edges():
    import math
    def clean_props(props):
        return {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in props.items()}
    edges = [
        {
            "source": u,
            "target": v,
            "type": d.get("type"),
            "properties": clean_props(d.get("properties", {}))
        }
        for u, v, d in tg.graph.edges(data=True)
    ]
    return {"edges": edges}

@router.get("/node/{node_id}")
def get_node(node_id: str):
    if node_id in tg.graph.nodes:
        return node_to_dict(node_id, tg.graph.nodes[node_id])
    return {"error": "Node not found"}

@router.get("/neighbors/{node_id}")
def get_neighbors(node_id: str):
    if node_id in tg.graph.nodes:
        neighbors = [node_to_dict(n, tg.graph.nodes[n]) for n in tg.graph.neighbors(node_id)]
        return {"neighbors": neighbors}
    return {"error": "Node not found"}
