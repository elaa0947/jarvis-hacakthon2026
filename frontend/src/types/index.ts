export type MachineStatus = 'IDLE' | 'WORKING' | 'BLOCKED' | 'STARVED' | 'DOWN';

export interface MachineConfig {
  id: string;
  name: string;
  processing_time: number;
  capacity: number;
  availability: number;
  downtime: number;
  status: MachineStatus;
  sequence: number;
}

export interface BufferConfig {
  id: string;
  capacity: number;
  current_wip: number;
  sequence: number;
}

export interface ProductionConfig {
  factory_id: string;
  factory_name: string;
  line_sequence: string[];
  machines: MachineConfig[];
  buffers: BufferConfig[];
}

export interface MachineMetrics {
  machine_id: string;
  name: string;
  utilization: number;
  queue_length: number;
  waiting_time: number;
  blocking_time: number;
  starvation_time: number;
  downtime: number;
  completed_jobs: number;
  status: MachineStatus;
  sequence: number;
  bottleneck_score: number;
}

export interface BufferMetrics {
  buffer_id: string;
  capacity: number;
  current_wip: number;
  avg_wip: number;
  max_wip: number;
  waiting_time: number;
  sequence: number;
}

export interface SimulationResult {
  run_id: string;
  simulation_time: number;
  throughput: number;
  wip: number;
  machines: Record<string, MachineMetrics>;
  buffers: Record<string, BufferMetrics>;
  primary_bottleneck: string;
  events_count: number;
}

export interface PropagationStep {
  step: number;
  stage: string;
  effect: string;
  metric_change: string;
}

export interface PropagationAnalysis {
  disrupted_machine: string;
  baseline_throughput: number;
  scenario_throughput: number;
  throughput_delta_pct: number;
  propagation_chain: PropagationStep[];
  summary: string;
}

export interface BottleneckItem {
  machine_id: string;
  name: string;
  bottleneck_score: number;
  bottleneck_status: string;
  reason: string;
  utilization: number;
  queue_length: number;
  upstream_blocking_caused: number;
  downstream_starvation_caused: number;
}

export interface BottleneckAnalysis {
  primary_bottleneck: string;
  primary_bottleneck_score: number;
  primary_reason: string;
  secondary_bottleneck?: string;
  analysis_breakdown: Record<string, BottleneckItem>;
}

export interface ScenarioComparisonRow {
  scenario_id: string;
  scenario_name: string;
  throughput: number;
  throughput_delta: string;
  wip: number;
  wip_delta: string;
  utilization: number;
  queue: number;
  blocking: number;
  starvation: number;
  primary_bottleneck: string;
  trade_offs: string;
}

export interface ScenarioComparisonMatrix {
  baseline_throughput: number;
  baseline_wip: number;
  baseline_bottleneck: string;
  comparison_matrix: ScenarioComparisonRow[];
}

export interface ApplyScenarioResponse {
  status: string;
  previous_bottleneck: string;
  new_bottleneck: string;
  migration_occurred: boolean;
  migration_summary: string;
  updated_factory_config: ProductionConfig;
  new_simulation_result: SimulationResult;
  new_bottleneck_analysis: BottleneckAnalysis;
}
