export interface SampleTopic {
  title: string;
  category: string;
  text: string;
}

export const SAMPLE_STUDY_NOTES: SampleTopic[] = [
  {
    title: 'Cellular Respiration (Biology)',
    category: 'Biology 101',
    text: `Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP. The overall equation is C6H12O6 + 6O2 -> 6CO2 + 6H2O + ~30-32 ATP.

Stage 1: Glycolysis
- Occurs in the cytoplasm.
- Breaks down 1 glucose (6 carbons) into 2 molecules of pyruvate (3 carbons each).
- Anaerobic process (does not require oxygen).
- Net yield: 2 ATP (via substrate-level phosphorylation) and 2 NADH.

Stage 2: Pyruvate Oxidation & The Citric Acid Cycle (Krebs Cycle)
- Occurs in the mitochondrial matrix.
- Pyruvate is converted into Acetyl-CoA, releasing 1 CO2 and producing 1 NADH per pyruvate.
- Acetyl-CoA enters the Citric Acid Cycle, combining with oxaloacetate (4 carbons) to form citrate (6 carbons).
- Per glucose molecule (2 turns of the cycle), it generates 2 ATP (or GTP), 6 NADH, 2 FADH2, and releases 4 CO2.

Stage 3: Oxidative Phosphorylation
- Located in the inner mitochondrial membrane (cristae).
- Consists of the Electron Transport Chain (ETC) and Chemiosmosis.
- NADH and FADH2 donate high-energy electrons to protein complexes I-IV.
- Oxygen serves as the final electron acceptor, combining with protons (H+) to form water (H2O).
- ATP synthase harnesses the proton motive force to synthesize ATP from ADP and inorganic phosphate. Produces the vast majority of cellular ATP (~26-28 ATP).`,
  },
  {
    title: 'Cognitive Biases & Memory (Psychology)',
    category: 'Psychology 200',
    text: `Cognitive biases are systematic patterns of deviation from norm or rationality in judgment.

Key Biases in Decision Making:
1. Confirmation Bias: The tendency to search for, interpret, favor, and recall information in a way that confirms one's preexisting beliefs or hypotheses while dismissing contradictory evidence.
2. Availability Heuristic: A mental shortcut that relies on immediate examples that come to a given person's mind when evaluating a specific topic, concept, method, or decision. Often leads to overestimating the likelihood of dramatic or sensational events (e.g. plane crashes vs car accidents).
3. Anchoring Effect: Cognitive bias where an individual depends too heavily on an initial piece of information offered (considered to be the "anchor") when making subsequent judgments. Once set, other judgments are made by adjusting away from that anchor.
4. Framing Effect: People decide on options based on whether the options are presented with positive or negative connotations; e.g. as a loss or as a gain. People tend to avoid risk when a positive frame is presented but seek risks when a negative frame is presented.

Working Memory Model (Baddeley & Hitch, 1974):
- Central Executive: Directs attention and coordinates sub-systems.
- Phonological Loop: Handles verbal and acoustic information (phonological store and articulatory rehearsal).
- Visuospatial Sketchpad: Stores and manipulates visual and spatial information.
- Episodic Buffer: Integrates information across domains with chronological sequencing and links to long-term memory.`,
  },
  {
    title: 'Sorting Algorithms & Complexity (CS)',
    category: 'Computer Science',
    text: `Algorithm Analysis and Comparison:

1. Merge Sort:
- Divide-and-conquer paradigm.
- Recursively divides array into two halves until single-element sub-arrays, then merges them in sorted order.
- Time Complexity: Best O(n log n), Average O(n log n), Worst O(n log n).
- Space Complexity: O(n) auxiliary space due to temporary arrays during merge.
- Stability: Stable sorting algorithm (preserves the relative order of duplicate elements).

2. Quick Sort:
- Selects a pivot element and partitions array so elements smaller than pivot go left, and larger go right.
- Time Complexity: Best O(n log n), Average O(n log n), Worst O(n^2) when pivot selection is poor (e.g. sorted array with first element as pivot).
- Space Complexity: O(log n) call stack space in average case.
- In-place sorting algorithm, generally not stable.

3. Binary Search:
- Requires a pre-sorted array.
- Compares target value to the middle element, halving the search space each step.
- Time Complexity: O(log n) worst and average case, O(1) best case.
- Space Complexity: O(1) iterative implementation.`,
  },
];
