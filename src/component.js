import React from 'react';
import PropTypes from 'prop-types';

export class FishList extends React.Component {

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

  handleChangeRow(e, row) {
    if (e.target.checked) {
      this.props.actions.selectFish(row);
    } else {
      this.props.actions.deselectFish(row);
    }
  }

  handleChange(e) {
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
FishList.propTypes = {
  actions: PropTypes.shape({
    fetchFishes: PropTypes.func,
    selectFish: PropTypes.func,
    deselectFish: PropTypes.func,
    selectAll: PropTypes.func,
    deselectAll: PropTypes.func
  }),
  fishes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })),
  selectedItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }))
};

function FishListRow(props) {
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
FishListRow.propTypes = {
  fish: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  selected: PropTypes.bool,
  onChange: PropTypes.func
};
