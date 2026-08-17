use extism_pdk::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Default, Deserialize, Serialize)]
struct GameState { score: u32, trail: Vec<f32> }

#[derive(Deserialize)]
struct RuntimeInput {
    #[serde(default)] state: Value,
    #[serde(default)] event: Value,
}

fn run(input: RuntimeInput, initialize: bool) -> FnResult<String> {
    let mut state: GameState = serde_json::from_value(input.state).unwrap_or_default();
    if initialize || state.trail.is_empty() { state.trail = vec![0.25, 0.42, 0.31, 0.68]; }
    if input.event.get("type").and_then(Value::as_str) == Some("action") {
        state.score = state.score.saturating_add(1);
        state.trail.push((state.score % 10) as f32 / 10.0);
        if state.trail.len() > 32 { state.trail.remove(0); }
    }
    let score = state.score;
    let trail = state.trail.iter().map(ToString::to_string).collect::<Vec<_>>().join(",");
    Ok(json!({ "state": state, "values": { "score": format!("Score {}", score), "trail": trail }, "commands": [] }).to_string())
}

#[plugin_fn]
pub fn initialize(input: Json<RuntimeInput>) -> FnResult<String> { run(input.0, true) }
#[plugin_fn]
pub fn handle_event(input: Json<RuntimeInput>) -> FnResult<String> { run(input.0, false) }
#[plugin_fn]
pub fn migrate_state(input: Json<RuntimeInput>) -> FnResult<String> { run(input.0, false) }
