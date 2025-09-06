import pandas as pd
import networkx as nx
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..')

class TaxonomyGraph:
    def __init__(self):
        self.graph = nx.Graph()
        self.occupations = None
        self.skills = None
        self.occupation_groups = None
        self.skill_groups = None
        self.occupation_to_skill_relations = None
        self.skill_to_skill_relations = None

    def load_csvs(self):
        self.occupations = pd.read_csv(os.path.join(DATA_DIR, 'occupations.csv'))
        self.skills = pd.read_csv(os.path.join(DATA_DIR, 'skills.csv'))
        self.occupation_groups = pd.read_csv(os.path.join(DATA_DIR, 'occupation_groups.csv'))
        self.skill_groups = pd.read_csv(os.path.join(DATA_DIR, 'skill_groups.csv'))
        self.occupation_to_skill_relations = pd.read_csv(os.path.join(DATA_DIR, 'occupation_to_skill_relations.csv'))
        self.skill_to_skill_relations = pd.read_csv(os.path.join(DATA_DIR, 'skill_to_skill_relations.csv'))

    def build_graph(self):
        # Add occupation group nodes
        for _, row in self.occupation_groups.iterrows():
            self.graph.add_node(
                f"group_{row['ID']}",
                type="group",
                title=row['PREFERREDLABEL'],
                description=row.get('DESCRIPTION', ''),
                code=row['CODE']
            )

        # Add occupation nodes
        for _, row in self.occupations.iterrows():
            self.graph.add_node(
                f"occ_{row['ID']}",
                type="occupation",
                title=row['PREFERREDLABEL'],
                description=row.get('DESCRIPTION', ''),
                group_code=row['OCCUPATIONGROUPCODE']
            )

        # Add skill nodes
        for _, row in self.skills.iterrows():
            self.graph.add_node(
                f"skill_{row['ID']}",
                type="skill",
                title=row['PREFERREDLABEL'],
                description=row.get('DESCRIPTION', '')
            )

        # Add group-to-occupation edges
        group_code_to_id = {row['CODE']: row['ID'] for _, row in self.occupation_groups.iterrows()}
        for _, row in self.occupations.iterrows():
            group_id = group_code_to_id.get(row['OCCUPATIONGROUPCODE'])
            if group_id:
                self.graph.add_edge(
                    f"group_{group_id}",
                    f"occ_{row['ID']}",
                    type="group_occupation",
                    properties={"group_code": row['OCCUPATIONGROUPCODE']}
                )

        # Add occupation-skill edges
        for _, row in self.occupation_to_skill_relations.iterrows():
            self.graph.add_edge(
                f"occ_{row['OCCUPATIONID']}",
                f"skill_{row['SKILLID']}",
                type="occ_skill",
                properties=row.to_dict()
            )

        # Add skill-skill edges
        for _, row in self.skill_to_skill_relations.iterrows():
            self.graph.add_edge(
                f"skill_{row['REQUIRINGID']}",
                f"skill_{row['REQUIREDID']}",
                type="skill_skill",
                properties=row.to_dict()
            )

# Usage:
# tg = TaxonomyGraph()
# tg.load_csvs()
# tg.build_graph()
# Now tg.graph is ready for queries
