import React from 'react';
import PropTypes from 'prop-types';

export class FishList extends React.Component {

  render() {
    const { fishes, selectedItems } = this.props;
    const selectedIds = selectedItems.reduce((set, f) => {
      set.add(f.id);
      return set;
    }, new Set());

    const rows = fishes.map(r => {
      return <FishListRow key={r.id} fish={r} selected={selectedIds.has(r.id)} />;
    });

    return (
      <div>
        <h3>おさかなリスト</h3>
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="all-check" /></th>
              <th>なまえ</th>
            </tr>
          </thead>
          <tbody id="fishes-list">
            {rows}
          </tbody>
        </table>
        <button type="button" id="select-button">けってい</button>
      </div>
    );
  }

}
FishList.propTypes = {
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
