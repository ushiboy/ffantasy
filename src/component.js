/* @flow */
import React from 'react';
import type { Fish, Action } from './fish.js';

type ActionCreator = (action: Action | Promise<Action>) => void;

type FishListProps = {
  fishes: Fish[],
  selectedItems: Fish[],
  actions: {
    fetchFishes: ActionCreator,
    selectFish: ActionCreator,
    deselectFish: ActionCreator,
    selectAll: ActionCreator,
    deselectAll: ActionCreator
  }
}

export class FishList extends React.Component<FishListProps> {

  render() {
    const { fishes, selectedItems } = this.props;
    const selectedIds = selectedItems.reduce((set, f) => {
      set.add(f.id);
      return set;
    }, new Set());
    const allSelected = selectedItems.length === fishes.length;

    const rows = fishes.map(r => {
      return <FishListRow key={r.id} fish={r} selected={selectedIds.has(r.id)} onChange={this.handleChangeRow.bind(this)} />;
    });

    return (
      <div>
        <h3>おさかなリスト</h3>
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="all-check" checked={allSelected} onChange={this.handleChange.bind(this)}  /></th>
              <th>なまえ</th>
            </tr>
          </thead>
          <tbody id="fishes-list">
            {rows}
          </tbody>
        </table>
        <button type="button" id="select-button" onClick={this.handleClick.bind(this)}>けってい</button>
      </div>
    );
  }

  componentDidMount() {
    this.props.actions.fetchFishes();
  }

  handleChangeRow(e: SyntheticInputEvent<HTMLInputElement>, row: Fish) {
    if (e.target.checked) {
      this.props.actions.selectFish(row);
    } else {
      this.props.actions.deselectFish(row);
    }
  }

  handleChange(e: SyntheticInputEvent<HTMLInputElement>) {
    const forceStatus = e.target.checked;
    if (forceStatus) {
      this.props.actions.selectAll();
    } else {
      this.props.actions.deselectAll();
    }
  }

  handleClick() {
    const { selectedItems } = this.props;
    if (selectedItems.length > 0) {
      const names = selectedItems.map(r => r.name);
      alert(names.join(','));
    } else {
      alert('せんたくしてください');
    }
  }

}

type FishListRowProps = {
  fish: Fish,
  selected: boolean,
  onChange: (e: SyntheticInputEvent<HTMLInputElement>, row: Fish) => void
}

function FishListRow(props: FishListRowProps) {
  const { name } = props.fish;
  const { selected, onChange } = props;
  return (
    <tr>
      <td>
        <input type="checkbox" className="select-row" checked={selected} onChange={(e) => {
          onChange(e, props.fish);
        }} />
      </td>
      <td>{name}</td>
    </tr>
  );
}
